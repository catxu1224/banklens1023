"""Seed the prototype's representative demo data into the configured database.

The script is intentionally idempotent: stable business keys are used to avoid
duplicating rows when the demo seed is rerun locally or in a fresh environment.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app import models  # noqa: F401
from app.db import Base, SessionLocal, engine


NOW = datetime.now(timezone.utc)


def get_or_create(db, model, lookup, values):
    query = select(model)
    for key, value in lookup.items():
        query = query.where(getattr(model, key) == value)
    row = db.scalar(query)
    if row is None:
        row = model(**lookup, **values)
        db.add(row)
        db.flush()
    return row


DOCUMENTS = [
    ("DOC-001", "商业银行资本管理办法", "国家金融监督管理总局令 2023年第4号", "国家金融监督管理总局", "资本监管", "2023-11-01", "2024-01-01", "现行有效", "部门规章", "构建差异化资本监管体系，明确资本计量、监督检查与信息披露要求。"),
    ("DOC-002", "银行业金融机构数据治理指引", "银保监发〔2018〕22号", "原中国银行保险监督管理委员会", "数据治理", "2018-05-21", "2018-05-21", "现行有效", "规范性文件", "明确数据治理架构、数据管理、数据质量控制和监管数据管理要求。"),
    ("DOC-003", "商业银行流动性风险管理办法", "中国银行保险监督管理委员会令 2018年第3号", "原中国银行保险监督管理委员会", "流动性风险", "2018-05-23", "2018-07-01", "现行有效", "部门规章", "规定流动性风险管理体系、流动性风险监管指标和监督管理要求。"),
    ("DOC-004", "商业银行大额风险暴露管理办法", "银保监会令 2018年第1号", "原中国银行保险监督管理委员会", "信用风险", "2018-04-24", "2018-07-01", "现行有效", "部门规章", "规范商业银行大额风险暴露管理，控制客户集中度风险。"),
    ("DOC-005", "金融统计管理规定", "中国人民银行令〔2002〕第9号", "中国人民银行", "金融统计", "2002-12-15", "2002-12-15", "历史版本", "部门规章", "规范金融统计活动和金融统计资料管理。"),
    ("DOC-006", "金融机构外汇业务数据报送规范", "汇发〔2025〕18号", "国家外汇管理局", "外汇管理", "2025-06-18", "2025-08-01", "现行有效", "规范性文件", "明确金融机构外汇业务数据报送范围、频率、口径和质量要求。"),
    ("DOC-007", "金融业数字化转型标准体系指南", "金融标准〔2025〕12号", "全国金融标准化技术委员会", "数据治理", "2025-04-12", "2025-04-12", "现行有效", "金融标准", "建立金融机构数字化转型标准体系，覆盖数据治理、技术架构与安全管理。"),
    ("DOC-008", "国家数据基础制度建设指引", "政数〔2024〕6号", "国务院相关部委", "数据治理", "2024-02-20", "2024-02-20", "现行有效", "政府文件", "从数据产权、流通交易、收益分配和安全治理等方面提出基础制度要求。"),
    ("DOC-009", "银行业数据治理自律规范", "银协发〔2024〕36号", "中国银行业协会", "数据治理", "2024-08-20", "2024-08-20", "现行有效", "行业自律规范", "围绕数据治理组织、数据标准、数据质量和数据安全提出行业自律要求。"),
    ("DOC-010", "金融数据安全技术规范", "GB/T 42775-2023", "国家标准化管理委员会", "数据安全", "2023-12-01", "2024-07-01", "现行有效", "国家标准", "规定金融数据分类分级、处理安全、共享使用和风险评估等技术要求。"),
]

TERMS = [
    ("金融机构编码", "Financial Institution Identifier", "国家标准", "基础数据", "用于唯一标识金融机构及其分支机构的标准化编码体系。", "金融机构编码规范"),
    ("金融工具统计分类", "Classification of Financial Instruments", "国家标准", "金融统计", "按照金融工具的法律属性、流动性和风险特征形成的统一统计分类。", "金融工具统计分类及编码"),
    ("数据元", "Data Element", "国家标准", "数据治理", "由一组属性规定其定义、标识、表示和允许值的数据单元。", "信息技术 数据元规范"),
    ("监管数据", "Regulatory Data", "行业标准", "数据治理", "银行业金融机构按照监管要求向监管部门报送的数据。", "银行业金融机构数据治理指引"),
    ("客户统一标识", "Unified Customer Identifier", "行业标准", "客户管理", "在银行业务系统中用于统一识别同一客户主体的行业数据标识。", "银行业数据标准体系"),
    ("大额风险暴露", "Large Exposure", "行业标准", "信用风险", "商业银行对单一客户或一组关联客户超过一定比例的信用风险暴露。", "商业银行大额风险暴露管理办法"),
    ("核心一级资本充足率", "CET1 Capital Adequacy Ratio", "监管指标", "资本监管", "核心一级资本净额与风险加权资产之间的比率。", "商业银行资本管理办法"),
    ("流动性覆盖率", "Liquidity Coverage Ratio, LCR", "监管指标", "流动性风险", "合格优质流动性资产与未来30日现金净流出量的比率。", "商业银行流动性风险管理办法"),
    ("风险加权资产", "Risk-weighted Assets, RWA", "监管指标", "资本监管", "按照信用风险、市场风险和操作风险计量规则计算的风险资产总额。", "商业银行资本管理办法"),
]

REPORTS = [
    ("SYS-A", "监管报送体系 A", "资本监管类报表", "RPT-A01", "资本充足情况表（示例）", "季报", "2026.1", "已发布"),
    ("SYS-B", "监管报送体系 B", "风险监测类报表", "RPT-B01", "流动性风险监测表（示例）", "月报", "2026.2", "已发布"),
    ("SYS-C", "金融统计体系", "金融统计类报表", "RPT-C01", "金融统计基础表（示例）", "月报", "2026.1", "草稿"),
    ("SYS-D", "监管报送体系 C", "客户风险类报表", "RPT-D01", "客户风险监测表（示例）", "季报", "2025.3", "待发布"),
]

METRICS = [
    ("CAP-001", "资本充足率", "资本监管", "%", ">= 8%", "资本净额 / 风险加权资产 × 100%", "商业银行资本管理办法", 8),
    ("CAP-002", "核心一级资本充足率", "资本监管", "%", ">= 5%", "核心一级资本净额 / 风险加权资产 × 100%", "商业银行资本管理办法", 12),
    ("LIQ-001", "流动性覆盖率", "流动性风险", "%", ">= 100%", "合格优质流动性资产 / 未来30日现金净流出量 × 100%", "商业银行流动性风险管理办法", 10),
    ("LIQ-002", "净稳定资金比例", "流动性风险", "%", ">= 100%", "可用的稳定资金 / 所需的稳定资金 × 100%", "商业银行流动性风险管理办法", 7),
    ("CRD-001", "不良贷款率", "信用风险", "%", "监测指标", "不良贷款余额 / 各项贷款余额 × 100%", "监管统计口径", 15),
]

INSTITUTIONS = [
    ("中国工商银行股份有限公司", "工商银行", "国有大型商业银行", "北京"),
    ("招商银行股份有限公司", "招商银行", "股份制商业银行", "广东"),
    ("北京银行股份有限公司", "北京银行", "城市商业银行", "北京"),
    ("上海农村商业银行股份有限公司", "沪农商行", "农村商业银行", "上海"),
    ("汇丰银行（中国）有限公司", "汇丰中国", "外资法人银行", "上海"),
]

PENALTIES = [
    ("某国有大型商业银行分行", "国有大型商业银行", "上海", "金融监管总局某监管局", "贷款管理不到位", "罚款", 180, "2026-10-09"),
    ("某城市商业银行", "城市商业银行", "浙江", "金融监管总局某监管局", "监管数据报送不准确", "警告并罚款", 95, "2026-10-07"),
    ("某股份制商业银行分行", "股份制商业银行", "广东", "金融监管总局某监管局", "授信管理不审慎", "罚款", 240, "2026-09-29"),
    ("某农村商业银行", "农村商业银行", "江苏", "金融监管总局某监管局", "关联交易管理不到位", "罚款", 130, "2026-09-24"),
    ("某外资银行分行", "外资银行", "北京", "中国人民银行某分行", "反洗钱客户身份识别不充分", "罚款", 310, "2026-09-18"),
]

TOPICS = [
    ("五篇大文章", "重点专题", "围绕科技金融、绿色金融、普惠金融、养老金融和数字金融，梳理监管要求与落地实践。"),
    ("AI 治理", "数字金融", "聚焦人工智能在银行业的应用边界、模型风险、数据安全和责任治理。"),
    ("资本新规", "资本监管", "跟踪资本计量、风险加权资产、信息披露及报表填报的最新变化。"),
]


def run():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        documents = {}
        for code, title, doc_code, agency, topic, publish, effective, validity, doc_type, summary in DOCUMENTS:
            source = get_or_create(db, models.ContentSource, {"source_type": "seed", "file_name": f"{code}.html"}, {"source_url": f"https://seed.bank-regulatory.local/{code}", "mime_type": "text/html"})
            document = get_or_create(db, models.KnowledgeDocument, {"document_code": doc_code}, {"doc_type": "regulation", "document_type": doc_type, "title": title, "issuing_agency": agency, "category": topic, "topic": topic, "summary": summary, "status": "published", "validity": validity, "publish_date": date.fromisoformat(publish), "effective_date": date.fromisoformat(effective), "created_at": NOW, "updated_at": NOW})
            documents[title] = document
            get_or_create(db, models.DocumentVersion, {"document_id": document.id, "version_no": "V1.0"}, {"source_id": source.id, "plain_text": summary, "status": "published", "published_at": NOW, "created_at": NOW, "updated_at": NOW})

        for title, english, term_type, category, definition, source_name in TERMS:
            source_doc = documents.get(source_name)
            get_or_create(db, models.Term, {"term": title}, {"english_name": english, "term_type": term_type, "category": category, "definition": definition, "source_document_id": source_doc.id if source_doc else None, "status": "published", "created_at": NOW, "updated_at": NOW})

        for code, title, description, report_code, name, frequency, version, status in REPORTS:
            system = get_or_create(db, models.ReportSystem, {"code": code}, {"name": title, "description": description, "sort_order": len(code), "status": "active", "created_at": NOW, "updated_at": NOW})
            report = get_or_create(db, models.Report, {"code": report_code}, {"system_id": system.id, "name": name, "report_type": "监管报表", "frequency": frequency, "status": "published" if status == "已发布" else "draft", "created_at": NOW, "updated_at": NOW})
            get_or_create(db, models.ReportVersion, {"report_id": report.id, "version_no": version}, {"status": "published" if status == "已发布" else "draft", "created_at": NOW, "updated_at": NOW})

        for code, name, category, unit, requirement, formula, source_name, faq_count in METRICS:
            source_doc = documents.get(source_name)
            metric = get_or_create(db, models.Metric, {"code": code}, {"name": name, "category": category, "unit": unit, "definition": f"{name}的监管统计口径。", "formula": formula, "requirement_text": requirement, "status": "published", "source_document_id": source_doc.id if source_doc else None, "created_at": NOW, "updated_at": NOW})
            get_or_create(db, models.MetricExplanation, {"metric_id": metric.id, "question": f"{name}如何理解？"}, {"answer": f"{name}应按照{source_name}的定义、适用范围和报送口径使用。", "category": category, "status": "published", "version_no": "V1.0", "created_at": NOW, "updated_at": NOW})

        institutions = {}
        for name, short, institution_type, region in INSTITUTIONS:
            institutions[name] = get_or_create(db, models.Institution, {"name": name}, {"short_name": short, "institution_type": institution_type, "region": region, "status": "active", "created_at": NOW, "updated_at": NOW})

        for index, (institution_name, institution_type, region, authority, violation, action, amount, penalty_date) in enumerate(PENALTIES, 1):
            get_or_create(db, models.PenaltyCase, {"case_no": f"SEED-PEN-{index:03d}"}, {"institution_id": None, "institution_name_snapshot": institution_name, "institution_type": institution_type, "authority": authority, "region": region, "penalty_date": date.fromisoformat(penalty_date), "violation_summary": violation, "action_summary": action, "amount": Decimal(str(amount)), "status": "published", "detail_json": {"seed": True}, "created_at": NOW, "updated_at": NOW})

        for name, short, institution_type, region in INSTITUTIONS[:4]:
            institution = institutions[name]
            get_or_create(db, models.AnnualReport, {"institution_name_snapshot": name, "report_year": 2025}, {"institution_id": institution.id, "report_type": "年度报告", "title": f"{name} 2025 年年度报告", "publish_date": date(2026, 3, 27), "region": region, "disclosure_status": "已披露", "status": "published", "created_at": NOW, "updated_at": NOW})

        for title, category, description in TOPICS:
            get_or_create(db, models.ResearchTopic, {"title": title}, {"category": category, "description": description, "status": "published", "featured": True, "published_at": NOW, "created_at": NOW, "updated_at": NOW})

        for username, display_name, email, department, status in [
            ("admin", "平台管理员", "admin@bank.local", "数据管理部", "active"),
            ("zhangming", "张明", "zhangming@bank.local", "风险管理部", "active"),
            ("lijing", "李静", "lijing@bank.local", "合规管理部", "active"),
            ("wangchen", "王晨", "wangchen@bank.local", "财务会计部", "active"),
            ("zhoumin", "周敏", "zhoumin@bank.local", "内部审计部", "disabled"),
        ]:
            get_or_create(db, models.User, {"username": username}, {"display_name": display_name, "email": email, "department": department, "status": status, "created_at": NOW, "updated_at": NOW})

        get_or_create(db, models.ParsingTask, {"title": "商业银行资本管理办法条款解析"}, {"task_type": "document_parse", "status": "processing", "progress": 72, "metadata_json": {"seed": True}, "created_at": NOW, "updated_at": NOW})
        get_or_create(db, models.ParsingTask, {"title": "监管报送体系 B 2026.2"}, {"task_type": "report_import", "status": "queued", "progress": 0, "metadata_json": {"seed": True}, "created_at": NOW, "updated_at": NOW})
        db.commit()

    print("Demo seed imported successfully.")


if __name__ == "__main__":
    run()
