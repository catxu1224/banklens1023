from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from .db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(180))
    department: Mapped[str | None] = mapped_column(String(160))
    password_hash: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(80))


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    role_id: Mapped[UUID] = mapped_column(ForeignKey("roles.id"), primary_key=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(80))
    resource_type: Mapped[str] = mapped_column(String(80))
    resource_id: Mapped[UUID | None] = mapped_column()
    before_data: Mapped[dict | None] = mapped_column(JsonType)
    after_data: Mapped[dict | None] = mapped_column(JsonType)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ContentSource(Base, TimestampMixin):
    __tablename__ = "content_sources"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    source_type: Mapped[str] = mapped_column(String(30))
    source_url: Mapped[str | None] = mapped_column(Text)
    file_name: Mapped[str | None] = mapped_column(String(255))
    object_key: Mapped[str | None] = mapped_column(Text)
    mime_type: Mapped[str | None] = mapped_column(String(120))
    file_size: Mapped[int | None] = mapped_column()
    sha256: Mapped[str | None] = mapped_column(String(64), index=True)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    snapshot_object_key: Mapped[str | None] = mapped_column(Text)


class KnowledgeDocument(Base, TimestampMixin):
    __tablename__ = "knowledge_documents"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    doc_type: Mapped[str] = mapped_column(String(40), index=True)
    document_type: Mapped[str | None] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(500), index=True)
    document_code: Mapped[str | None] = mapped_column(String(160), index=True)
    issuing_agency: Mapped[str | None] = mapped_column(String(160), index=True)
    category: Mapped[str | None] = mapped_column(String(80), index=True)
    region: Mapped[str | None] = mapped_column(String(80), index=True)
    topic: Mapped[str | None] = mapped_column(String(120), index=True)
    summary: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    validity: Mapped[str | None] = mapped_column(String(30), index=True)
    publish_date: Mapped[date | None] = mapped_column(Date)
    effective_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    current_version_id: Mapped[UUID | None] = mapped_column()


class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "document_versions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    version_no: Mapped[str] = mapped_column(String(60))
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))
    html_object_key: Mapped[str | None] = mapped_column(Text)
    plain_text: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JsonType)
    processing_notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    change_summary: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (UniqueConstraint("document_id", "version_no"),)


class DocumentSection(Base):
    __tablename__ = "document_sections"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    version_id: Mapped[UUID] = mapped_column(ForeignKey("document_versions.id"), index=True)
    parent_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_sections.id"))
    section_no: Mapped[str | None] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(500))
    level: Mapped[int] = mapped_column(Integer, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    content: Mapped[str | None] = mapped_column(Text)
    page_start: Mapped[int | None] = mapped_column()
    page_end: Mapped[int | None] = mapped_column()


class DocumentClause(Base):
    __tablename__ = "document_clauses"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    version_id: Mapped[UUID] = mapped_column(ForeignKey("document_versions.id"), index=True)
    section_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_sections.id"))
    clause_no: Mapped[str | None] = mapped_column(String(80))
    clause_text: Mapped[str] = mapped_column(Text)
    normalized_text: Mapped[str | None] = mapped_column(Text)
    effective_scope: Mapped[dict | None] = mapped_column(JsonType)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    version_id: Mapped[UUID] = mapped_column(ForeignKey("document_versions.id"), index=True)
    section_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_sections.id"))
    clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))
    chunk_no: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int | None] = mapped_column()
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JsonType)
    search_text: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[str | None] = mapped_column(Text)
    embedding_model: Mapped[str | None] = mapped_column(String(120))
    content_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class ReportSystem(Base, TimestampMixin):
    __tablename__ = "report_systems"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")


class Report(Base, TimestampMixin):
    __tablename__ = "reports"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    system_id: Mapped[UUID] = mapped_column(ForeignKey("report_systems.id"), index=True)
    code: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    report_type: Mapped[str | None] = mapped_column(String(80))
    frequency: Mapped[str | None] = mapped_column(String(40))
    applicable_scope: Mapped[dict | None] = mapped_column(JsonType)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)


class ReportVersion(Base, TimestampMixin):
    __tablename__ = "report_versions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(ForeignKey("reports.id"), index=True)
    version_no: Mapped[str] = mapped_column(String(60))
    effective_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    template_source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))
    guide_document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JsonType)
    status: Mapped[str] = mapped_column(String(30), default="draft")
    change_summary: Mapped[str | None] = mapped_column(Text)


class ReportForm(Base):
    __tablename__ = "report_forms"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_version_id: Mapped[UUID] = mapped_column(ForeignKey("report_versions.id"), index=True)
    form_code: Mapped[str] = mapped_column(String(100))
    form_name: Mapped[str] = mapped_column(String(300))
    sheet_name: Mapped[str | None] = mapped_column(String(200))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    schema_json: Mapped[dict | None] = mapped_column(JsonType)


class ReportField(Base):
    __tablename__ = "report_fields"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    form_id: Mapped[UUID] = mapped_column(ForeignKey("report_forms.id"), index=True)
    field_code: Mapped[str] = mapped_column(String(120))
    field_name: Mapped[str] = mapped_column(String(300))
    data_type: Mapped[str | None] = mapped_column(String(40))
    unit: Mapped[str | None] = mapped_column(String(40))
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    definition: Mapped[str | None] = mapped_column(Text)
    dimension_config: Mapped[dict | None] = mapped_column(JsonType)
    display_config: Mapped[dict | None] = mapped_column(JsonType)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class ValidationRule(Base):
    __tablename__ = "validation_rules"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_version_id: Mapped[UUID] = mapped_column(ForeignKey("report_versions.id"), index=True)
    rule_code: Mapped[str] = mapped_column(String(120))
    rule_type: Mapped[str] = mapped_column(String(40))
    expression: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20))
    message: Mapped[str | None] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    config: Mapped[dict | None] = mapped_column(JsonType)


class Metric(Base, TimestampMixin):
    __tablename__ = "metrics"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    category: Mapped[str | None] = mapped_column(String(100))
    unit: Mapped[str | None] = mapped_column(String(60))
    definition: Mapped[str | None] = mapped_column(Text)
    formula: Mapped[str | None] = mapped_column(Text)
    requirement_text: Mapped[str | None] = mapped_column(String(300))
    applicability: Mapped[dict | None] = mapped_column(JsonType)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    source_document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    source_clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))


class MetricExplanation(Base, TimestampMixin):
    __tablename__ = "metric_explanations"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    metric_id: Mapped[UUID] = mapped_column(ForeignKey("metrics.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(80))
    source_document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    source_clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))
    version_no: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(30), default="draft")


class Term(Base, TimestampMixin):
    __tablename__ = "terms"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    term: Mapped[str] = mapped_column(String(300), index=True)
    english_name: Mapped[str | None] = mapped_column(String(300))
    abbreviation: Mapped[str | None] = mapped_column(String(120))
    term_type: Mapped[str] = mapped_column(String(40), index=True)
    category: Mapped[str | None] = mapped_column(String(120), index=True)
    definition: Mapped[str | None] = mapped_column(Text)
    source_document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    source_clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)


class Standard(Base, TimestampMixin):
    __tablename__ = "standards"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    code: Mapped[str | None] = mapped_column(String(160), index=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    standard_type: Mapped[str] = mapped_column(String(40), index=True)
    issuing_agency: Mapped[str | None] = mapped_column(String(160))
    publish_date: Mapped[date | None] = mapped_column(Date)
    effective_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))


class Institution(Base, TimestampMixin):
    __tablename__ = "institutions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(300), index=True)
    short_name: Mapped[str | None] = mapped_column(String(120))
    institution_type: Mapped[str | None] = mapped_column(String(100))
    region: Mapped[str | None] = mapped_column(String(80), index=True)
    regulator: Mapped[str | None] = mapped_column(String(160))
    institution_code: Mapped[str | None] = mapped_column(String(120), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="active")


class PenaltyCase(Base, TimestampMixin):
    __tablename__ = "penalty_cases"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_no: Mapped[str | None] = mapped_column(String(160), index=True)
    institution_id: Mapped[UUID | None] = mapped_column(ForeignKey("institutions.id"))
    institution_name_snapshot: Mapped[str] = mapped_column(String(300))
    institution_type: Mapped[str | None] = mapped_column(String(80))
    authority: Mapped[str | None] = mapped_column(String(160), index=True)
    region: Mapped[str | None] = mapped_column(String(80), index=True)
    penalty_date: Mapped[date | None] = mapped_column(Date, index=True)
    violation_summary: Mapped[str | None] = mapped_column(Text)
    action_summary: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))
    detail_json: Mapped[dict | None] = mapped_column(JsonType)


class AnnualReport(Base, TimestampMixin):
    __tablename__ = "annual_reports"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    institution_id: Mapped[UUID | None] = mapped_column(ForeignKey("institutions.id"))
    institution_name_snapshot: Mapped[str] = mapped_column(String(300), index=True)
    report_year: Mapped[int] = mapped_column(Integer, index=True)
    report_type: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(500))
    publish_date: Mapped[date | None] = mapped_column(Date)
    region: Mapped[str | None] = mapped_column(String(80), index=True)
    disclosure_status: Mapped[str | None] = mapped_column(String(40))
    file_size: Mapped[int | None] = mapped_column()
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))
    parsed_document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)


class ResearchTopic(Base, TimestampMixin):
    __tablename__ = "research_topics"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(300), index=True)
    category: Mapped[str | None] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TopicRelation(Base):
    __tablename__ = "topic_relations"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    topic_id: Mapped[UUID] = mapped_column(ForeignKey("research_topics.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(40), index=True)
    target_id: Mapped[str] = mapped_column(String(160), index=True)
    relation_role: Mapped[str | None] = mapped_column(String(80))


class CrawlerSource(Base, TimestampMixin):
    __tablename__ = "crawler_sources"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(String(40))
    agency: Mapped[str | None] = mapped_column(String(160))
    region: Mapped[str | None] = mapped_column(String(80))
    schedule: Mapped[str] = mapped_column(String(80), default="daily")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_status: Mapped[str | None] = mapped_column(String(30))


class CrawlerRun(Base):
    __tablename__ = "crawler_runs"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    crawler_source_id: Mapped[UUID] = mapped_column(ForeignKey("crawler_sources.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="queued")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    discovered_count: Mapped[int] = mapped_column(Integer, default=0)
    created_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    error_summary: Mapped[str | None] = mapped_column(Text)


class ParsingTask(Base, TimestampMixin):
    __tablename__ = "parsing_tasks"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(300))
    task_type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("content_sources.id"))
    error_message: Mapped[str | None] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JsonType)


class AIProvider(Base, TimestampMixin):
    __tablename__ = "ai_providers"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    provider_type: Mapped[str] = mapped_column(String(40))
    display_name: Mapped[str] = mapped_column(String(120))
    base_url: Mapped[str | None] = mapped_column(Text)
    protocol: Mapped[str] = mapped_column(String(40), default="openai_compatible")
    api_key_encrypted: Mapped[str | None] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)


class AIModel(Base, TimestampMixin):
    __tablename__ = "ai_models"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    provider_id: Mapped[UUID] = mapped_column(ForeignKey("ai_providers.id"), index=True)
    model_name: Mapped[str] = mapped_column(String(160))
    capability: Mapped[str] = mapped_column(String(30))
    dimension: Mapped[int | None] = mapped_column(Integer)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    max_tokens: Mapped[int | None] = mapped_column(Integer)
    temperature: Mapped[float | None] = mapped_column()
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)


class AISession(Base, TimestampMixin):
    __tablename__ = "ai_sessions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str | None] = mapped_column(String(300))
    model_id: Mapped[UUID | None] = mapped_column(ForeignKey("ai_models.id"))
    knowledge_scope: Mapped[str] = mapped_column(String(60), default="all")
    retrieval_mode: Mapped[str] = mapped_column(String(40), default="internal_only")
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AIMessage(Base):
    __tablename__ = "ai_messages"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(ForeignKey("ai_sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    response_json: Mapped[dict | None] = mapped_column(JsonType)
    error_message: Mapped[str | None] = mapped_column(Text)


class AICitation(Base):
    __tablename__ = "ai_citations"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    message_id: Mapped[UUID] = mapped_column(ForeignKey("ai_messages.id"), index=True)
    document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    version_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_versions.id"))
    section_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_sections.id"))
    clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))
    chunk_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_chunks.id"))
    score: Mapped[float | None] = mapped_column()
    location: Mapped[str | None] = mapped_column(String(300))


class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_settings"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    setting_key: Mapped[str] = mapped_column(String(160), unique=True)
    setting_value: Mapped[dict | None] = mapped_column(JsonType)
    value_type: Mapped[str] = mapped_column(String(30), default="json")
    scope: Mapped[str] = mapped_column(String(40), default="global")
    description: Mapped[str | None] = mapped_column(Text)


class ReportBasis(Base):
    __tablename__ = "report_basis"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_version_id: Mapped[UUID] = mapped_column(ForeignKey("report_versions.id"), index=True)
    document_id: Mapped[UUID | None] = mapped_column(ForeignKey("knowledge_documents.id"))
    clause_id: Mapped[UUID | None] = mapped_column(ForeignKey("document_clauses.id"))
    relation_type: Mapped[str] = mapped_column(String(40), default="basis")


class ReportVersionDiff(Base):
    __tablename__ = "report_version_diffs"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_version_id: Mapped[UUID] = mapped_column(ForeignKey("report_versions.id"), index=True)
    previous_version_id: Mapped[UUID | None] = mapped_column(ForeignKey("report_versions.id"))
    change_type: Mapped[str] = mapped_column(String(30))
    object_type: Mapped[str] = mapped_column(String(40))
    object_code: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str | None] = mapped_column(String(300))
    detail: Mapped[str | None] = mapped_column(Text)


class CorrectionReport(Base, TimestampMixin):
    __tablename__ = "correction_reports"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    resource_type: Mapped[str] = mapped_column(String(40), index=True)
    resource_id: Mapped[str] = mapped_column(String(160), index=True)
    resource_title: Mapped[str] = mapped_column(String(500))
    correction_type: Mapped[str] = mapped_column(String(60), index=True)
    description: Mapped[str] = mapped_column(Text)
    current_value: Mapped[str | None] = mapped_column(Text)
    suggested_value: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text)
    reporter_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    reporter_name: Mapped[str | None] = mapped_column(String(120))
    reporter_contact: Mapped[str | None] = mapped_column(String(180))
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    admin_note: Mapped[str | None] = mapped_column(Text)
    resolved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

