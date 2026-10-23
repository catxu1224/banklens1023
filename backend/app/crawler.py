"""Crawlers for configured regulatory source directories.

The first adapter targets the legacy HTML directory used by the supplied
Iweicha URL.  It intentionally keeps the raw source URL and HTML snapshot so
that parsers can be improved without losing the original evidence.
"""

from __future__ import annotations

import hashlib
import re
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import ContentSource, CrawlerRun, CrawlerSource, PenaltyCase


def _clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _parse_date(value: str | None) -> date | None:
    match = re.search(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", value or "")
    if not match:
        return None
    try:
        return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


def _parse_amount(value: str | None) -> Decimal | None:
    match = re.search(r"罚款\s*([\d,]+(?:\.\d+)?)\s*万?元", value or "")
    if not match:
        match = re.search(r"^\s*([\d,]+(?:\.\d+)?)\s*$", value or "")
    if not match:
        return None
    return Decimal(match.group(1).replace(",", ""))


def _field_map(soup: BeautifulSoup) -> dict[str, str]:
    fields: dict[str, str] = {}
    # The source uses malformed table markup in some detail pages. Parse the
    # visible label sequence first, which also avoids treating the whole
    # record as a single table cell.
    labels = [
        "行政处罚决定书文号", "处罚对象", "当事人名称（姓名）", "违法事实", "违法行为类型",
        "处罚依据", "处罚决定", "行政处罚内容", "处罚机关", "作出行政处罚决定机关名称",
        "处罚日期", "作出行政处罚决定日期", "处罚金额（万）", "原文链接", "信息来源", "标题", "日期",
    ]
    label_pattern = "|".join(re.escape(label) for label in labels)
    text = _clean(soup.get_text(" ", strip=True))
    matches = list(re.finditer(rf"(?<!\S)({label_pattern})(?=\s|$)", text))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        value = _clean(text[match.end():end])
        if value:
            fields[match.group(1)] = value
    if not any(label in fields for label in labels):
        for row in soup.select("tr"):
            cells = [_clean(cell.get_text(" ", strip=True)) for cell in row.select("th, td")]
            if len(cells) >= 2 and cells[0] and cells[1]:
                fields[cells[0].rstrip("：:")] = cells[1]
    return fields


def _detail_links(directory_url: str, html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []
    seen: set[str] = set()
    for anchor in soup.select("a[href]"):
        href = urljoin(directory_url, anchor.get("href", "").strip())
        is_legacy_detail = "form_id=" in href and "smp_type=display_table" in href
        is_compact_detail = "con=" in href and "smp_index=" in href
        if not (is_legacy_detail or is_compact_detail):
            continue
        if href not in seen:
            seen.add(href)
            links.append(href)
    return links


def _extract_case(detail_url: str, html: str, source: CrawlerSource) -> dict:
    soup = BeautifulSoup(html, "lxml")
    fields = _field_map(soup)
    title = fields.get("标题") or _clean(soup.title.get_text()) if soup.title else "监管处罚案例"
    institution = fields.get("处罚对象") or fields.get("当事人名称（姓名）") or "未识别处罚对象"
    institution = re.sub(r"及相关责任人$", "", institution).strip()
    authority = fields.get("处罚机关") or fields.get("作出行政处罚决定机关名称") or source.agency or ""
    violation = fields.get("违法事实") or fields.get("违法行为类型") or ""
    action = fields.get("处罚决定") or fields.get("行政处罚内容") or ""
    penalty_date = _parse_date(fields.get("处罚日期")) or _parse_date(fields.get("作出行政处罚决定日期")) or _parse_date(fields.get("日期"))
    penalty_date = penalty_date or _parse_date(detail_url)
    amount = _parse_amount(action) or _parse_amount(fields.get("处罚金额（万）"))
    case_no = fields.get("行政处罚决定书文号") or re.search(r"[&?]con=([^& ]+)", detail_url).group(1) if re.search(r"[&?]con=([^& ]+)", detail_url) else None
    return {
        "title": title,
        "case_no": case_no,
        "institution": institution,
        "authority": authority,
        "region": source.region,
        "penalty_date": penalty_date,
        "violation": violation,
        "action": action,
        "amount": amount,
        "source_url": detail_url,
        "raw_text": _clean(soup.get_text(" ", strip=True)),
        "original_url": fields.get("原文链接"),
    }


def run_source(db: Session, source: CrawlerSource) -> CrawlerRun:
    run = CrawlerRun(crawler_source_id=source.id, status="running", started_at=datetime.now(timezone.utc))
    db.add(run)
    db.flush()
    settings = get_settings()
    snapshot_dir = settings.storage_path / "snapshots" / "crawler" / str(source.id)
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    try:
        headers = {"User-Agent": "BankRegulatoryKnowledgeCrawler/0.1 (+admin-configured-source)"}
        with httpx.Client(timeout=35, follow_redirects=True, headers=headers) as client:
            directory_response = client.get(source.url)
            directory_response.raise_for_status()
            detail_urls = _detail_links(source.url, directory_response.text)
            run.discovered_count = len(detail_urls)
            for detail_url in detail_urls:
                try:
                    response = client.get(detail_url)
                    response.raise_for_status()
                    payload = response.text
                    parsed = _extract_case(detail_url, payload, source)
                    digest = hashlib.sha256(payload.encode("utf-8", errors="ignore")).hexdigest()
                    snapshot_name = f"{digest}.html"
                    (snapshot_dir / snapshot_name).write_text(payload, encoding="utf-8")
                    content_source = db.scalar(select(ContentSource).where(ContentSource.source_url == detail_url))
                    if content_source is None:
                        content_source = ContentSource(source_type="crawler", source_url=detail_url)
                        db.add(content_source)
                        db.flush()
                    content_source.file_name = parsed["title"]
                    content_source.mime_type = "text/html"
                    content_source.sha256 = digest
                    content_source.fetched_at = datetime.now(timezone.utc)
                    content_source.snapshot_object_key = str(Path("snapshots") / "crawler" / str(source.id) / snapshot_name)
                    lookup = parsed["case_no"] or detail_url
                    # The directory's `con` value is stable, while the detail
                    # page may later expose a formal penalty document number.
                    # Source identity is therefore the primary deduplication key.
                    existing = db.scalar(select(PenaltyCase).where(PenaltyCase.source_id == content_source.id))
                    if existing is None:
                        existing = db.scalar(select(PenaltyCase).where(PenaltyCase.case_no == lookup))
                    if existing is None:
                        existing = PenaltyCase(case_no=lookup, institution_name_snapshot=parsed["institution"], status="draft")
                        db.add(existing)
                        run.created_count += 1
                    else:
                        run.updated_count += 1
                        existing.case_no = lookup
                    existing.institution_name_snapshot = parsed["institution"]
                    existing.authority = parsed["authority"]
                    existing.region = parsed["region"]
                    existing.penalty_date = parsed["penalty_date"]
                    existing.violation_summary = parsed["violation"]
                    existing.action_summary = parsed["action"]
                    existing.amount = parsed["amount"]
                    existing.status = existing.status or "draft"
                    existing.source_id = content_source.id
                    existing.detail_json = {"title": parsed["title"], "raw_text": parsed["raw_text"], "original_url": parsed.get("original_url"), "crawler_source_id": str(source.id)}
                except Exception:
                    run.failed_count += 1
            run.status = "success" if run.failed_count == 0 else "partial_success"
            run.finished_at = datetime.now(timezone.utc)
            source.last_run_at = run.finished_at
            source.last_status = run.status
            db.commit()
    except Exception as exc:
        db.rollback()
        run.status = "failed"
        run.error_summary = str(exc)[:2000]
        run.finished_at = datetime.now(timezone.utc)
        source.last_run_at = run.finished_at
        source.last_status = "failed"
        db.add(run)
        db.commit()
    return run


def run_enabled_sources(db: Session) -> list[CrawlerRun]:
    sources = db.scalars(select(CrawlerSource).where(CrawlerSource.enabled.is_(True))).all()
    return [run_source(db, source) for source in sources]
