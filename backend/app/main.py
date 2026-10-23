from pathlib import Path

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from .config import get_settings
from .content_parser import parse_uploaded_content
from .db import Base, engine, get_db
from .models import (
    AnnualReport, CorrectionReport, ContentSource, KnowledgeDocument, Metric,
    ParsingTask, PenaltyCase, Report, ReportSystem, ResearchTopic, Standard, Term,
    User,
)

settings = get_settings()
app = FastAPI(title="银规智库后端", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CorrectionCreate(BaseModel):
    resource_type: str = Field(pattern="^(document|report|penalty)$")
    resource_id: str
    resource_title: str
    correction_type: str
    description: str = Field(min_length=2, max_length=5000)
    current_value: str | None = None
    suggested_value: str | None = None
    source_url: str | None = None
    reporter_name: str | None = None
    reporter_contact: str | None = None
    priority: str = "normal"


class CorrectionUpdate(BaseModel):
    status: str = Field(pattern="^(pending|processing|resolved|rejected)$")
    admin_note: str | None = None


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception as exc:
        database = f"error: {type(exc).__name__}"
    return {"status": "ok", "database": database, "environment": settings.app_env}


@app.get("/api/initialization/status")
def initialization_status(db: Session = Depends(get_db)):
    docs = db.scalar(select(func.count()).select_from(KnowledgeDocument)) or 0
    reports = db.scalar(select(func.count()).select_from(Report)) or 0
    return {
        "documents": {"count": docs, "requires_initialization": docs == 0},
        "reports": {"count": reports, "requires_initialization": reports == 0},
        "penalties": {"count": 0, "source": "crawler_after_deployment"},
        "message": "请先初始化制度文档和监管报表资料。" if docs == 0 or reports == 0 else None,
    }


def _count(db: Session, model, *conditions):
    query = select(func.count()).select_from(model)
    if conditions:
        query = query.where(*conditions)
    return db.scalar(query) or 0


@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    """Return dashboard counters from the current database, never from demo constants."""
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    published = lambda model: model.status.in_({"published", "active"})
    pending = lambda model: model.status.in_({"draft", "pending", "processing", "queued"})

    documents = _count(db, KnowledgeDocument, KnowledgeDocument.deleted_at.is_(None))
    reports = _count(db, Report, Report.deleted_at.is_(None))
    metrics = _count(db, Metric, Metric.deleted_at.is_(None))
    terms = _count(db, Term, Term.deleted_at.is_(None))
    standards = _count(db, Standard, Standard.deleted_at.is_(None))
    penalties = _count(db, PenaltyCase, PenaltyCase.deleted_at.is_(None))
    annual_reports = _count(db, AnnualReport, AnnualReport.deleted_at.is_(None))
    topics = _count(db, ResearchTopic, ResearchTopic.deleted_at.is_(None))
    knowledge_objects = sum((documents, reports, metrics, terms, standards, penalties, annual_reports, topics))
    new_documents_7d = _count(db, KnowledgeDocument, KnowledgeDocument.deleted_at.is_(None), KnowledgeDocument.created_at >= week_start)
    new_documents_30d = _count(db, KnowledgeDocument, KnowledgeDocument.deleted_at.is_(None), KnowledgeDocument.created_at >= now - timedelta(days=30))
    pending_publish = sum(_count(db, model, model.deleted_at.is_(None), pending(model)) for model in (KnowledgeDocument, Report, Metric, Term, Standard, AnnualReport, ResearchTopic))
    parsing_tasks = _count(db, ParsingTask, ParsingTask.status.in_({"queued", "running", "processing"}))
    return {
        "database": "postgresql" if settings.database_url.startswith("postgresql") else "sqlite",
        "knowledge_objects": knowledge_objects,
        "documents": documents,
        "reports": reports,
        "metrics": metrics,
        "terms": terms + standards,
        "penalties": penalties,
        "annual_reports": annual_reports,
        "topics": topics,
        "new_documents_7d": new_documents_7d,
        "new_documents_30d": new_documents_30d,
        "pending_publish": pending_publish,
        "parsing_tasks": parsing_tasks,
        "users": _count(db, User, User.deleted_at.is_(None)),
    }


@app.get("/api/knowledge/documents")
def list_documents(db: Session = Depends(get_db)):
    rows = db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.deleted_at.is_(None)).order_by(KnowledgeDocument.updated_at.desc())).all()
    return [{"id": str(row.id), "title": row.title, "code": row.document_code, "agency": row.issuing_agency, "category": row.category, "status": row.status, "summary": row.summary} for row in rows]


@app.get("/api/reports/systems")
def list_report_systems(db: Session = Depends(get_db)):
    systems = db.scalars(select(ReportSystem).where(ReportSystem.deleted_at.is_(None)).order_by(ReportSystem.sort_order)).all()
    return [{"id": str(row.id), "code": row.code, "name": row.name, "description": row.description} for row in systems]


@app.post("/api/corrections", status_code=201)
def create_correction(payload: CorrectionCreate, db: Session = Depends(get_db)):
    correction = CorrectionReport(**payload.model_dump())
    db.add(correction)
    db.commit()
    db.refresh(correction)
    return {"id": str(correction.id), "status": correction.status, "message": "纠错信息已提交，管理员会尽快处理。"}


@app.get("/api/admin/corrections")
def list_corrections(status: str | None = None, db: Session = Depends(get_db)):
    query = select(CorrectionReport).order_by(CorrectionReport.created_at.desc())
    if status:
        query = query.where(CorrectionReport.status == status)
    rows = db.scalars(query).all()
    items = [{
        "id": str(row.id), "resource_type": row.resource_type, "resource_id": row.resource_id,
        "resource_title": row.resource_title, "correction_type": row.correction_type,
        "description": row.description, "current_value": row.current_value,
        "suggested_value": row.suggested_value, "source_url": row.source_url,
        "reporter_name": row.reporter_name, "reporter_contact": row.reporter_contact,
        "priority": row.priority, "status": row.status, "admin_note": row.admin_note,
        "created_at": row.created_at,
    } for row in rows]
    return {"items": items, "total": len(items)}


@app.patch("/api/admin/corrections/{correction_id}")
def update_correction(correction_id: UUID, payload: CorrectionUpdate, db: Session = Depends(get_db)):
    correction = db.get(CorrectionReport, correction_id)
    if correction is None:
        raise HTTPException(status_code=404, detail="纠错记录不存在")
    correction.status = payload.status
    correction.admin_note = payload.admin_note
    if payload.status in {"resolved", "rejected"}:
        correction.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": str(correction.id), "status": correction.status}


@app.post("/api/admin/initialization/upload")
async def upload_initialization_file(file: UploadFile = File(...), content_type: str = "document"):
    allowed = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"}
    suffix = Path(file.filename or "").suffix.lower()
    if file.content_type not in allowed and suffix not in {".pdf", ".doc", ".docx", ".xls", ".xlsx"}:
        raise HTTPException(status_code=400, detail="仅支持 PDF、Word 和 Excel 文件")
    target = settings.storage_path / "originals" / Path(file.filename or "upload.bin").name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(await file.read())
    return {"status": "uploaded", "content_type": content_type, "filename": file.filename, "path": str(target), "next": "create_parsing_task"}


@app.post("/api/admin/content/import", status_code=202)
async def import_content_file(file: UploadFile = File(...), content_type: str = "document", db: Session = Depends(get_db)):
    allowed_suffixes = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_suffixes:
        raise HTTPException(status_code=400, detail="仅支持 Excel、Word 和 PDF 文件")
    content = await file.read()
    target = settings.storage_path / "imports" / Path(file.filename or "import.bin").name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    source = ContentSource(source_type="file", file_name=Path(file.filename or "import.bin").name, object_key=str(target), mime_type=file.content_type, file_size=len(content))
    db.add(source)
    db.flush()
    try:
        summary = parse_uploaded_content(target, suffix)
        task_status = "succeeded"
        task_progress = 100
    except Exception as exc:
        summary = {"format": suffix.lstrip("."), "error": f"解析失败：{type(exc).__name__}"}
        task_status = "failed"
        task_progress = 0
    task = ParsingTask(title=Path(file.filename or "批量导入").stem, task_type=f"content_import:{content_type}", status=task_status, progress=task_progress, source_id=source.id, metadata_json={"content_type": content_type, "suffix": suffix, "extract": ["text", "headings", "tables", "metadata"], "summary": summary})
    db.add(task)
    db.commit()
    return {"status": task_status, "task_id": str(task.id), "source_id": str(source.id), "filename": file.filename, "summary": summary, "message": "文件已接收，解析任务已创建。"}


@app.get("/api/admin/content/template")
def download_content_template(content_type: str):
    template_fields = {
        "terms": [("term", "术语名称", "术语或指标的正式中文名称", "核心一级资本充足率", "是"), ("english_name", "英文名称", "对应的英文全称或缩写", "CET1 Capital Adequacy Ratio", "否"), ("term_type", "类型", "术语、标准或监管指标的对象类型", "监管指标", "是"), ("category", "分类", "只能填写：国家标准、行业标准、监管指标、其他", "监管指标", "是"), ("definition", "标准定义", "术语的统一定义、适用范围和口径；支持纯文本或 HTML 富文本", "用于衡量银行核心一级资本抵御风险的能力", "是"), ("source", "来源依据", "已有制度或标准名称；没有匹配项时可填写自定义依据", "商业银行资本管理办法", "否")],
        "penalties": [("case_no", "处罚文号", "监管处罚决定书文号", "金罚决字〔2025〕1号", "否"), ("institution_name", "被处罚机构", "被处罚银行或机构全称", "某某银行股份有限公司", "是"), ("institution_type", "机构类型", "全国性银行、区域性银行、外资银行或其他", "全国性银行", "否"), ("authority", "监管机构", "作出处罚的监管机构名称", "国家金融监督管理总局", "是"), ("region", "地区", "处罚发生地或监管机构所在地区", "北京", "否"), ("penalty_date", "处罚日期", "处罚决定日期，格式 YYYY-MM-DD", "2025-06-30", "是"), ("violation_summary", "违规行为", "违规事实和行为摘要", "流动资金贷款违规流入房地产领域", "是"), ("action_summary", "处罚措施", "罚款、警告、责令整改等处罚措施", "罚款 120 万元", "否"), ("amount", "金额（万元）", "罚款金额，使用数字填写，单位为万元", "120", "否"), ("source_url", "源页面链接", "监管机构原始处罚网页地址", "https://example.gov.cn/penalty/1", "否")],
        "annual": [("institution_name", "机构名称", "披露报告的金融机构全称", "某某银行股份有限公司", "是"), ("report_year", "报告年度", "报告所属年度，填写四位年份", "2025", "是"), ("report_type", "报告类型", "年度报告、社会责任报告、ESG 报告等", "年度报告", "是"), ("title", "报告标题", "报告的正式标题", "2025 年年度报告", "是"), ("publish_date", "发布日期", "报告公开发布日期，格式 YYYY-MM-DD", "2026-03-27", "否"), ("region", "地区", "机构注册地或报告所属地区", "北京", "否"), ("disclosure_status", "披露状态", "已披露、待更新或历史版本", "已披露", "是"), ("source_url", "源页面链接", "报告原始网页地址", "https://example.com/report", "否")],
        "topics": [("title", "专题名称", "专题研究的正式名称", "资本新规", "是"), ("category", "专题分类", "专题所属业务或监管主题", "资本监管", "是"), ("description", "专题说明", "专题背景、研究范围和核心问题", "梳理资本新规对银行报送和经营管理的影响", "否"), ("featured", "是否首页展示", "填写是或否，控制是否出现在首页最新专题", "是", "否")],
        "documents": [("title", "文档名称", "制度或法规正式名称", "商业银行资本管理办法", "是"), ("document_code", "文号", "发文文号或制度编号", "国家金融监督管理总局令 2023 年第 4 号", "否"), ("doc_type", "内容类型", "监管制度、行政处罚或报表填写说明", "监管制度", "是"), ("document_type", "文档类型", "办法、通知、指引、公告等", "办法", "否"), ("issuing_agency", "发文机构", "制度发布机构名称", "国家金融监督管理总局", "是"), ("category", "分类", "业务主题分类", "资本监管", "否"), ("region", "地区", "全国或地方监管地区", "全国", "否"), ("publish_date", "发布日期", "发布日期，格式 YYYY-MM-DD", "2023-11-01", "否"), ("effective_date", "生效日期", "生效日期，格式 YYYY-MM-DD", "2024-01-01", "否"), ("validity", "有效性", "现行有效、即将生效、已废止或历史版本", "现行有效", "是"), ("source_url", "源页面链接", "原始网页地址", "https://example.gov.cn/doc/1", "否")],
        "reports": [("system_code", "报送体系编码", "监管报送体系的唯一编码", "CAPITAL", "是"), ("report_code", "报表编码", "报表唯一编码", "CAP-001", "是"), ("name", "报表名称", "报表正式名称", "资本充足率报表", "是"), ("frequency", "报送频度", "日、月、季、半年或年等报送频度", "季报", "是"), ("version", "版本", "报表版本号", "2026.1", "是"), ("status", "状态", "草稿、待发布、已发布或已下线", "草稿", "是"), ("source_url", "源页面链接", "报表制度或表样来源地址", "https://example.gov.cn/report", "否")],
        "metrics": [("code", "指标代码", "指标唯一编码", "CAP-001", "是"), ("name", "指标名称", "指标正式名称", "核心一级资本充足率", "是"), ("category", "分类", "指标所属监管主题", "资本监管", "是"), ("unit", "单位", "百分比、万元、户等计量单位", "%", "否"), ("definition", "指标定义", "指标含义和统计口径", "核心一级资本净额与风险加权资产的比值", "是"), ("formula", "计算公式", "可执行的指标计算公式", "核心一级资本净额/风险加权资产", "否"), ("requirement_text", "监管要求", "监管阈值或制度要求说明", "不得低于 5%", "否"), ("status", "状态", "草稿、待发布或已发布", "已发布", "是"), ("source_url", "源页面链接", "指标制度依据地址", "https://example.gov.cn/metric", "否")],
        "users": [("name", "姓名", "用户真实姓名", "张三", "是"), ("email", "邮箱", "用于登录和通知的邮箱地址", "zhangsan@bank.local", "是"), ("role", "角色", "只能填写管理员或普通用户", "普通用户", "是"), ("department", "部门", "用户所属部门", "风险管理部", "否"), ("status", "状态", "正常或已停用", "正常", "是")],
    }
    if content_type not in template_fields:
        raise HTTPException(status_code=400, detail="不支持的模板类型")
    from openpyxl import Workbook

    fields = template_fields[content_type]
    keys = [field[0] for field in fields]
    headers = [field[1] for field in fields]
    template_dir = settings.storage_path / "templates"
    template_dir.mkdir(parents=True, exist_ok=True)
    target = template_dir / f"bank-regulatory-{content_type}-template.xlsx"
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "导入数据"
    sheet.append(keys)
    sheet.append(headers)
    guide = workbook.create_sheet("字段说明")
    guide.append(["字段名", "中文说明", "字段定义与填写说明", "示例", "是否必填"])
    for key, header, description, example, required in fields:
        guide.append([key, header, description, example, required])
    workbook.save(target)
    workbook.close()
    return FileResponse(target, filename=target.name, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.on_event("startup")
def prepare_storage():
    for name in ("originals", "snapshots", "parsed", "exports", "imports"):
        (settings.storage_path / name).mkdir(parents=True, exist_ok=True)
