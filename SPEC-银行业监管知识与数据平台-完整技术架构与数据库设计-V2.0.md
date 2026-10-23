# 银规智库：完整技术架构与数据库设计 Spec

| 项目 | 内容 |
|---|---|
| 产品名称 | 银行业监管知识与数据平台（银规智库） |
| 文档版本 | V2.0 |
| 文档状态 | 技术设计评审稿 |
| 日期 | 2026-10-17 |
| 当前前端 | React + Vite |
| 后端建议 | FastAPI + PostgreSQL + pgvector |
| 模型接入 | 千问、DeepSeek、GLM、自定义 API |

## 1. 设计目标与范围

### 1.1 产品目标

平台面向银行业合规、风险、监管报送、财务、数据治理、审计和研究人员，统一管理监管制度、监管术语与标准、监管报表、监管指标、行政处罚、金融机构和能力评估框架，形成“来源—解析—结构化—检索—关联—问答—审计”的知识服务闭环。

### 1.2 本版范围

本 Spec 覆盖：

1. 用户端和管理后台的后端服务边界。
2. 管理员和普通用户两类角色及权限。
3. 知识文档、报表、指标、处罚、机构和框架的数据模型。
4. Word、PDF、Excel、网页 URL 的解析与版本管理。
5. 关键词、模糊、全文、向量和重排序组合检索。
6. 基于千问、DeepSeek、GLM 和自定义 API 的 RAG 问答。
7. 监管发文和监管处罚 URL 目录的每日采集。
8. PostgreSQL、pgvector、Redis、MinIO 的部署和降级策略。

报表的正式体系、报表清单、字段清单和校验规则由业务方后续提供。本系统采用配置化模型，不将当前 demo 中的示例报表视为正式业务数据。

### 1.3 明确不在本版范围

- 不建设银行核心业务交易系统。
- 不替代监管正式报送平台。
- 不自动形成具有法律效力的监管结论。
- 不在本地运行大模型。
- 不在第一阶段引入独立图数据库。

## 2. 总体架构

```text
浏览器
  ↓ HTTPS
React + Vite 前端
  ↓ REST / SSE
FastAPI API / AI Gateway
  ├── 认证与权限模块
  ├── 知识库模块
  ├── 文档解析模块
  ├── 报表配置模块
  ├── 指标与标准模块
  ├── 处罚与采集模块
  ├── 搜索与 RAG 模块
  ├── 管理配置模块
  └── 审计日志模块
       ↓
PostgreSQL + pgvector
MinIO / S3 对象存储
Redis 任务队列与缓存
       ↓
Qwen / DeepSeek / GLM / Custom API
```

### 2.1 部署形态

第一阶段采用模块化单体后端：

```text
bank-regulatory-backend/
├── app/api
├── app/core
├── app/models
├── app/services
├── app/workers
├── app/parsers
├── app/search
├── app/ai
├── migrations
└── tests
```

当解析、爬虫或 AI 调用量增加后，再将 Worker、Indexer 和 AI Gateway 独立部署，不改变数据库模型和 API 契约。

## 3. 角色与权限

系统只保留两类角色：管理员、普通用户。

| 功能 | 普通用户 | 管理员 |
|---|---:|---:|
| 浏览和搜索已发布内容 | 是 | 是 |
| 收藏、历史和 AI 问答 | 是 | 是 |
| 下载已发布源文件 | 按内容权限 | 是 |
| 上传 Word/PDF/Excel/URL | 否 | 是 |
| 发起解析、查看解析结果 | 否 | 是 |
| 编辑文档、条款和关联关系 | 否 | 是 |
| 发布、下线、回滚和删除 | 否 | 是 |
| 配置报送体系、报表、字段、规则 | 否 | 是 |
| 配置指标公式和释疑 | 否 | 是 |
| 配置爬虫 URL 目录 | 否 | 是 |
| 配置 AI 模型和知识范围 | 否 | 是 |
| 管理普通用户 | 否 | 是 |
| 查看审计日志和任务日志 | 否 | 是 |

权限必须由后端 API 校验，前端隐藏菜单不能作为安全边界。正式内容采用逻辑删除；发布、下线、回滚和批量操作必须写入审计日志。

## 4. 核心业务状态

### 4.1 内容状态

```text
draft      草稿
processing 解析中
reviewing  待管理员确认
published  已发布
offline    已下线
archived   已归档
```

### 4.2 版本规则

- 每次发布产生一个不可变版本。
- 旧版本保留，不覆盖原始内容。
- 默认检索范围为 `published + effective` 内容。
- 历史版本可在详情页和版本差异页查询。
- 文档、报表、指标和处罚均保留来源、版本、发布时间和操作人。

## 5. 数据库设计原则

### 5.1 数据库选型

- PostgreSQL：业务主库、全文检索和权限数据。
- pgvector：文档切片、字段解释和处罚内容的向量检索。
- `pg_trgm`：中文标题、文号、机构名称和代码模糊搜索。
- MinIO/S3：原始文件、网页快照、解析产物和导出文件。
- Redis：异步队列、缓存、限流和任务锁。

第一阶段可使用 PostgreSQL 全文检索 + pgvector；暂不要求 OpenSearch、Milvus 或图数据库。

### 5.2 通用字段

除说明外，业务表统一包含：

```text
id              UUID 主键
created_at      timestamptz 非空
updated_at      timestamptz 非空
created_by      UUID，可空
updated_by      UUID，可空
deleted_at      timestamptz，可空，逻辑删除
```

时间统一使用 UTC 存储，API 根据用户时区显示为 Asia/Shanghai。

## 6. 数据库详细设计

以下为核心表设计。字段类型采用 PostgreSQL 类型。

### 6.1 用户、权限和审计

#### `users`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | uuid | PK | 用户 ID |
| username | varchar(80) | UNIQUE | 登录名 |
| display_name | varchar(120) | NOT NULL | 姓名/显示名 |
| email | varchar(180) | 可空 | 邮箱 |
| department | varchar(160) | 可空 | 所属部门 |
| password_hash | text | 可空 | 密码哈希，若接入统一认证可为空 |
| status | varchar(20) | NOT NULL | active/disabled |
| last_login_at | timestamptz | 可空 | 最近登录 |

索引：`username` 唯一索引、`status` 索引。

#### `roles`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | varchar(40) | `admin` / `user` |
| name | varchar(80) | 角色名称 |

#### `user_roles`

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | uuid | FK users.id |
| role_id | uuid | FK roles.id |

主键：`(user_id, role_id)`。

#### `audit_logs`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| actor_id | uuid | 操作人 |
| action | varchar(80) | 操作类型 |
| resource_type | varchar(80) | 资源类型 |
| resource_id | uuid | 资源 ID |
| before_data | jsonb | 修改前摘要 |
| after_data | jsonb | 修改后摘要 |
| ip_address | inet | IP |
| user_agent | text | 客户端 |
| created_at | timestamptz | 操作时间 |

索引：`(resource_type, resource_id, created_at desc)`、`(actor_id, created_at desc)`。

### 6.2 来源和附件

#### `content_sources`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| source_type | varchar(30) | file/url/manual/crawler |
| source_url | text | 原始 URL |
| file_name | varchar(255) | 原始文件名 |
| object_key | text | MinIO/S3 对象键 |
| mime_type | varchar(120) | 文件类型 |
| file_size | bigint | 文件大小 |
| sha256 | char(64) | 内容哈希 |
| fetched_at | timestamptz | 抓取时间 |
| snapshot_object_key | text | 网页快照对象键 |

索引：`sha256`、`source_url`、`fetched_at desc`。

#### `attachments`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| source_id | uuid | FK content_sources.id |
| parent_type | varchar(40) | document/report/penalty |
| parent_id | uuid | 业务对象 ID |
| object_key | text | 文件对象键 |
| download_name | varchar(255) | 下载文件名 |
| is_public | boolean | 是否允许普通用户下载 |

### 6.3 知识文档、版本和条款

#### `knowledge_documents`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| doc_type | varchar(40) | regulation/standard/penalty/report_guide |
| title | varchar(500) | 标题 |
| document_code | varchar(160) | 文号/标准号 |
| issuing_agency | varchar(160) | 发文机构 |
| category | varchar(80) | 金监总局、人民银行等 |
| region | varchar(80) | 全国或地方 |
| topic | varchar(120) | 业务主题 |
| status | varchar(30) | 内容状态 |
| validity | varchar(30) | 有效性 |
| publish_date | date | 发布日期 |
| effective_date | date | 生效日期 |
| expiry_date | date | 失效日期 |
| current_version_id | uuid | 当前发布版本 |

索引：

```sql
CREATE INDEX ix_docs_title_trgm ON knowledge_documents USING gin (title gin_trgm_ops);
CREATE INDEX ix_docs_code_trgm ON knowledge_documents USING gin (document_code gin_trgm_ops);
CREATE INDEX ix_docs_filter ON knowledge_documents (category, issuing_agency, validity, region);
```

#### `document_versions`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| document_id | uuid | FK knowledge_documents.id |
| version_no | varchar(60) | 版本号 |
| source_id | uuid | FK content_sources.id |
| html_object_key | text | 网页版对象键，可空 |
| plain_text | text | 清洗后的全文 |
| metadata | jsonb | 解析元数据 |
| status | varchar(30) | draft/reviewing/published/offline |
| published_at | timestamptz | 发布时间 |
| published_by | uuid | 发布人 |
| change_summary | text | 变更说明 |
| processing_notes | text | 解析和发布处理备注 |

索引：`(document_id, version_no)` 唯一、`status`、`published_at desc`。

#### `document_sections`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| version_id | uuid | FK document_versions.id |
| parent_id | uuid | 父章节 |
| section_no | varchar(80) | 章节编号 |
| title | varchar(500) | 章节标题 |
| level | smallint | 层级 |
| sort_order | integer | 顺序 |
| content | text | 章节正文 |
| page_start | integer | 起始页 |
| page_end | integer | 结束页 |

索引：`(version_id, sort_order)`、标题 trigram 索引。

#### `document_clauses`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| version_id | uuid | FK document_versions.id |
| section_id | uuid | FK document_sections.id |
| clause_no | varchar(80) | 条款编号 |
| clause_text | text | 条款正文 |
| normalized_text | text | 规范化文本 |
| effective_scope | jsonb | 适用机构、地区等 |
| search_vector | tsvector | 全文检索向量 |

### 6.4 向量检索表

#### `knowledge_chunks`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| version_id | uuid | 来源版本 |
| section_id | uuid | 来源章节 |
| clause_id | uuid | 来源条款，可空 |
| chunk_no | integer | 切片序号 |
| content | text | 切片正文 |
| token_count | integer | token 估算 |
| metadata | jsonb | 页码、代码、来源等 |
| search_vector | tsvector | 关键词检索 |
| embedding | vector(维度) | 向量，维度按 Embedding 模型确定 |
| embedding_model | varchar(120) | 向量模型 |
| content_hash | char(64) | 切片哈希 |
| is_active | boolean | 是否参与默认检索 |

索引：

```sql
CREATE INDEX ix_chunks_search ON knowledge_chunks USING gin (search_vector);
CREATE INDEX ix_chunks_meta ON knowledge_chunks USING gin (metadata);
CREATE INDEX ix_chunks_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
```

如果暂未安装 pgvector，先保留 `search_vector` 和 `content`，向量字段在迁移阶段启用。

### 6.5 监管报表

#### `report_systems`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | varchar(80) | 体系代码 |
| name | varchar(200) | 体系名称 |
| description | text | 体系说明 |
| sort_order | integer | 排序 |
| status | varchar(20) | active/inactive |

#### `reports`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| system_id | uuid | FK report_systems.id |
| code | varchar(100) | 报表代码 |
| name | varchar(300) | 报表名称 |
| report_type | varchar(80) | 报表类型 |
| frequency | varchar(40) | 日/月/季/年/专项 |
| applicable_scope | jsonb | 机构和主体范围 |
| status | varchar(30) | draft/published/offline |

索引：`(system_id, sort_order)`、代码和名称 trigram 索引。

#### `report_versions`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| report_id | uuid | FK reports.id |
| version_no | varchar(60) | 版本 |
| effective_date | date | 生效日期 |
| expiry_date | date | 失效日期 |
| template_source_id | uuid | 表样来源 |
| guide_document_id | uuid | 填报说明 |
| status | varchar(30) | 状态 |
| change_summary | text | 变更说明 |

#### `report_forms`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| report_version_id | uuid | FK report_versions.id |
| form_code | varchar(100) | 表单代码 |
| form_name | varchar(300) | 表单名称 |
| sheet_name | varchar(200) | Excel 工作表名称 |
| sort_order | integer | 顺序 |

#### `report_fields`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| form_id | uuid | FK report_forms.id |
| field_code | varchar(120) | 字段代码 |
| field_name | varchar(300) | 字段名称 |
| data_type | varchar(40) | 字符、金额、日期等 |
| unit | varchar(40) | 单位 |
| required | boolean | 是否必填 |
| definition | text | 字段口径 |
| dimension_config | jsonb | 维度和取值 |
| sort_order | integer | 顺序 |

#### `validation_rules`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| report_version_id | uuid | 版本 |
| rule_code | varchar(120) | 规则代码 |
| rule_type | varchar(40) | 必填、枚举、勾稽、范围、变动 |
| expression | text | 规则表达式 |
| severity | varchar(20) | 高/中/低 |
| message | text | 命中提示 |
| enabled | boolean | 是否启用 |

#### `report_basis` 与 `report_version_diffs`

用于保存报表制度依据和版本差异，分别关联 `document_clauses`、字段和规则，支持报表详情页五个页签：报表表样、字段字典、校验规则、版本差异、制度依据。

### 6.6 指标、术语和标准

#### `metrics`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | varchar(120) | 指标代码 |
| name | varchar(300) | 指标名称 |
| category | varchar(100) | 指标分类 |
| unit | varchar(60) | 计量单位 |
| definition | text | 指标定义 |
| formula | text | 公式 |
| applicability | jsonb | 适用范围 |
| status | varchar(30) | 状态 |

#### `metric_versions`

保存指标公式、口径、来源制度和版本变更。

#### `terms`、`standards`

分别保存监管术语、国家标准、行业标准和监管指标分类。术语详情必须可以关联来源制度、报表字段和指标。

### 6.7 监管处罚

#### `penalty_cases`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| case_no | varchar(160) | 处罚文号 |
| institution_id | uuid | 被处罚机构 |
| institution_type | varchar(80) | 全国性/区域性/外资/其他 |
| authority | varchar(160) | 监管机构 |
| region | varchar(80) | 地区 |
| penalty_date | date | 处罚日期 |
| violation_summary | text | 违规行为 |
| action_summary | text | 处罚措施 |
| amount | numeric(18,2) | 金额 |
| status | varchar(30) | 状态 |
| source_id | uuid | 来源 |

索引：监管机构、机构类型、地区、日期，机构名称和违规行为 trigram 索引。

#### `violation_tags`、`penalty_case_tags`

用于违规行为分类、趋势分析和 AI 主题统计。

### 6.8 金融机构

#### `institutions`

保存机构名称、简称、机构类型、地区、统一代码、监管机构、有效状态和历史名称。

#### `institution_aliases`

用于处罚文书和年报中的机构名称归一化。

### 6.9 爬虫和解析任务

#### `crawler_sources`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | varchar(200) | 目录名称 |
| url | text | 固定目录 URL |
| content_type | varchar(40) | regulation/penalty/report_guide |
| agency | varchar(160) | 监管机构 |
| region | varchar(80) | 地区 |
| schedule | varchar(80) | 默认每日 |
| enabled | boolean | 是否启用 |
| last_run_at | timestamptz | 最近执行 |
| last_status | varchar(30) | 状态 |

#### `crawler_runs`

记录开始时间、结束时间、发现数量、新增数量、更新数量、失败数量和错误摘要。

#### `parsing_tasks`

统一记录文件解析、网页解析、向量化和索引任务：任务类型、状态、进度、重试次数、错误信息和关联资源。

### 6.10 AI 会话和模型配置

#### `ai_providers`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| provider_type | varchar(40) | qwen/deepseek/glm/custom |
| display_name | varchar(120) | 用户端名称 |
| base_url | text | API 地址 |
| protocol | varchar(40) | qwen/openai_compatible |
| api_key_encrypted | text | 加密 API Key |
| enabled | boolean | 是否启用 |
| timeout_seconds | integer | 超时 |

#### `ai_models`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| provider_id | uuid | FK ai_providers.id |
| model_name | varchar(160) | 模型名 |
| capability | varchar(30) | chat/embedding/rerank |
| is_default | boolean | 默认模型 |
| max_tokens | integer | 最大输出 |
| temperature | numeric(3,2) | 温度 |
| enabled | boolean | 是否启用 |

Embedding 模型必须记录维度和版本。更换 Embedding 模型时，创建新的索引批次，不覆盖旧向量。

#### `ai_sessions`

保存用户、标题、模型、知识范围、检索模式、创建时间和最后活动时间。`retrieval_mode` 支持 `internal_only`（仅站内知识）和 `web_augmented`（允许网络补充）；首期默认只启用 `internal_only`。

#### `ai_messages`

保存用户问题、模型回答、耗时、token 使用量、错误信息和结构化响应。

#### `ai_citations`

保存消息、文档版本、章节、条款、切片、排序分数和前端跳转地址。

### 6.11 文件纠错与处理记录

用户可在制度文档、监管报表和监管处罚详情页提交纠错。纠错记录不直接修改正式内容，先进入管理员待处理队列；管理员完成核对后，通过内容维护流程修正原资源，并将处理结论写回纠错记录，形成可追溯闭环。

#### `correction_reports`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| resource_type | varchar(40) | document/report/penalty |
| resource_id | varchar(160) | 被纠错资源 ID 或业务编码 |
| resource_title | varchar(500) | 提交时保存的资源标题快照 |
| correction_type | varchar(60) | 内容、日期、生效状态、机构、字段规则、来源等 |
| description | text | 用户对错误的描述，必填 |
| current_value | text | 当前页面内容快照，可选 |
| suggested_value | text | 建议修改内容，可选 |
| source_url | text | 用户提供的依据链接 |
| reporter_id | uuid | 提交用户，可为空 |
| reporter_name | varchar(120) | 提交人姓名 |
| reporter_contact | varchar(180) | 联系方式 |
| priority | varchar(20) | normal/high |
| status | varchar(30) | pending/processing/resolved/rejected |
| admin_note | text | 管理员处理说明 |
| resolved_by | uuid | 处理管理员 |
| resolved_at | timestamptz | 完成或驳回时间 |
| created_at/updated_at | timestamptz | 创建和更新时间 |

纠错记录必须保留资源定位信息和提交时快照；正式内容的修改、发布、下线和回滚继续写入 `audit_logs`。管理员后台提供“全部、待处理、处理中、已解决”队列，支持接收、驳回和修正完成操作。

### 6.12 原型字段覆盖补充

对当前前端原型中的静态数据逐项核对后，以下字段需要在正式数据库中显式保存，不能只依赖页面展示或临时计算。

#### 文档摘要和标签

`knowledge_documents` 补充：

| 字段 | 类型 | 说明 |
|---|---|---|
| summary | text | 列表摘要和搜索结果摘要 |
| document_type | varchar(80) | 部门规章、规范性文件、国家标准等展示类型 |

制度分类继续使用 `category` 保存金监总局制度、人民银行制度、外管局制度、政府制度、国家标准、金融标准和其他；`doc_type`/`document_type` 保存文档类型，两者不能混用。

增加：

```text
tags
├── id
├── name
└── tag_type

document_tags
├── document_id
└── tag_id
```

用于保存原型中的 `tags` 数组，并支持按资本监管、数据治理、流动性风险等主题检索。

#### 术语与标准

`terms` 采用以下字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| term | varchar(300) | 中文术语 |
| english_name | varchar(300) | 英文名称 |
| abbreviation | varchar(120) | 缩写 |
| term_type | varchar(40) | 国家标准/行业标准/监管指标 |
| category | varchar(120) | 术语主题 |
| definition | text | 标准定义 |
| source_document_id | uuid | 来源制度/标准 |
| source_clause_id | uuid | 来源条款，可空 |
| status | varchar(30) | 草稿/已发布/已下线 |
| last_verified_at | timestamptz | 最后校核时间 |

增加 `term_aliases` 保存别名，增加 `term_relations` 保存术语与制度、报表字段、指标之间的关联。

`standards` 至少保存：标准号、标准名称、标准类型、发布机构、发布日期、生效日期、状态、摘要、源文档和当前版本。

#### 指标、阈值和释疑

`metrics` 补充：

| 字段 | 类型 | 说明 |
|---|---|---|
| requirement_text | varchar(300) | 原型中的监管要求，如 `>= 8%` |
| faq_count | integer | 释疑数量，可由释疑表聚合校验 |
| source_document_id | uuid | 主要来源制度 |
| source_clause_id | uuid | 主要来源条款，可空 |
| last_verified_at | timestamptz | 最后校核时间 |

增加：

```text
metric_explanations
├── id
├── metric_id
├── question
├── answer
├── category
├── source_document_id
├── source_clause_id
├── version_no
├── status
└── published_at

metric_report_fields
├── metric_id
├── report_field_id
└── mapping_type
```

`faq_count`优先通过 `metric_explanations` 聚合生成，保留冗余字段仅用于列表性能和数据校验。

#### 能力评估框架

当前原型中的 DCMM 和监管数据管理框架不能只写在前端常量中，应增加：

```text
assessment_frameworks
├── id
├── code
├── name
├── description
├── framework_type
├── version_no
├── status
└── source_document_id

framework_domains
├── id
├── framework_id
├── code
├── name
├── description
└── sort_order

framework_items
├── id
├── domain_id
├── code
├── name
├── definition
├── assessment_content
└── sort_order

framework_levels
├── id
├── framework_id
├── code
├── name
├── description
└── sort_order

framework_item_requirements
├── id
├── item_id
├── level_id
├── requirement_text
└── source_clause_id
```

当前只保存框架结构、能力项、等级定义和评价说明，不保存机构现状、评分和评估结果。后续如果建设正式评估功能，再独立增加 `assessment_projects`、`assessment_scores` 等表。

#### 业务合规约束

原型中的约束事项需要增加：

```text
compliance_constraints
├── id
├── constraint_type
├── title
├── business_area
├── risk_level
├── description
├── source_document_id
├── source_clause_id
├── status
└── version_no

constraint_relations
├── constraint_id
├── relation_type
├── target_type
└── target_id
```

其中 `constraint_type` 支持禁止事项、限制事项、程序要求、披露要求；`risk_level` 支持高、中、低。

#### 年报与披露资料

增加：

```text
annual_reports
├── id
├── institution_id
├── report_year
├── report_type
├── title
├── publish_date
├── region
├── disclosure_status
├── file_size
├── source_id
├── parsed_document_id
└── status
```

原型中的报告年度、报告类型、发布日期、地区、披露状态、机构名称、标题和文件大小均可保存；列表中的文件大小应从 `content_sources.file_size` 聚合或同步。

#### 首页动态和后台任务

增加：

```text
content_updates
├── id
├── update_type
├── title
├── occurred_at
├── tone
├── resource_type
├── resource_id
└── visible

task_runs
├── id
├── title
├── task_type
├── status
├── progress
├── owner_id
├── started_at
├── finished_at
├── error_message
└── metadata
```

`content_updates` 对应首页最近更新；`task_runs` 对应后台的文档解析、报表版本、指标维护和批量导入任务。展示用的 `time` 应由时间字段格式化，不单独存字符串。

#### 系统配置和发布记录

增加：

```text
system_settings
├── id
├── setting_key
├── setting_value
├── value_type
├── scope
├── description
└── updated_by

publication_records
├── id
├── resource_type
├── resource_id
├── version_id
├── action
├── risk_level
├── change_summary
├── scheduled_at
├── published_at
├── operator_id
└── status
```

`system_settings` 保存平台名称、默认语言、复核提醒周期、默认可见范围、搜索规则和 AI 配置开关。`publication_records` 对应后台发布中心的待发布、定时发布、已发布、下线、风险等级和版本差异记录。

#### 监管数据质量和趋势分析

`validation_rules` 代表规则定义，不能直接替代质量问题结果。增加：

```text
quality_issue_types
├── id
├── code
├── name
├── severity
└── description

quality_issue_snapshots
├── id
├── issue_type_id
├── report_id
├── snapshot_date
├── issue_count
├── previous_count
├── change_rate
└── metadata
```

处罚趋势中的月份、案件数和金额属于聚合结果，不建议重复保存为业务事实表；可通过 `penalty_cases.penalty_date` 和 `amount` 查询，或建立按月刷新的物化视图 `mv_penalty_monthly_trend`。

首页知识对象数量、搜索分类数量、报表/字段/规则数量同样使用查询聚合或统计快照，不作为原型常量写入业务表。

#### 研究专题和关联关系

原型专题页中的标题、分类、描述、制度数量和指标数量增加：

```text
research_topics
├── id
├── title
├── category
├── description
├── status
├── featured
└── published_at

topic_relations
├── topic_id
├── target_type
├── target_id
└── relation_role
```

制度、报表、指标、处罚、术语和机构之间的关系统一使用关系表保存，避免把关系固化在前端页面。

### 6.12 原型字段覆盖结论

| 原型模块 | 覆盖情况 | 处理方式 |
|---|---|---|
| 制度文档库 | 部分覆盖 | 补充摘要、文档展示类型、标签表 |
| 制度详情和版本 | 已覆盖 | 使用来源、版本、章节、条款表 |
| 术语与标准 | 部分覆盖 | 补充英文名、缩写、定义、来源和别名 |
| 业务合规约束 | 原 Spec 缺表 | 增加约束事项和关联表 |
| 能力评估框架 | 原 Spec 缺表 | 增加框架、域、能力项、等级和要求表 |
| 监管报表 | 基本覆盖 | 表单、字段、规则、版本差异需落表 |
| 监管指标 | 部分覆盖 | 补充监管要求、释疑和来源映射 |
| 监管数据质量 | 部分覆盖 | 增加质量问题类型和结果快照 |
| 监管处罚 | 基本覆盖 | 补充机构名称快照和处罚文书关联 |
| 金融机构名单 | 基本覆盖 | 处罚/报表数量采用聚合字段 |
| 年报资料库 | 原 Spec 缺表 | 增加年报表和源文件关联 |
| 首页最近更新 | 原 Spec 缺表 | 增加动态表 |
| 后台维护任务 | 部分覆盖 | 补充任务展示和执行字段 |
| 用户管理 | 部分覆盖 | `users` 补充部门字段，最后登录使用 `last_login_at` |
| 系统配置 | 原 Spec 缺表 | 增加 `system_settings` |
| 内容发布中心 | 部分覆盖 | 增加 `publication_records` |
| AI 会话和引用 | 已覆盖 | 使用会话、消息、引用表 |
| 爬虫目录和任务 | 已覆盖 | 使用来源、运行记录和解析任务表 |

结论：**当前 V2.0 Spec 不是所有原型字段都已显式落表**。本节补充后，原型中的业务字段均有明确归属；其中统计数量、趋势、更新时间和筛选结果等展示字段优先通过查询聚合或物化视图生成，不重复保存为事实字段。

## 7. 文档解析和知识入库

### 7.1 支持格式

| 来源 | 处理内容 |
|---|---|
| Word | 标题、段落、表格、脚注、页码 |
| PDF | 文本层、页码、表格；扫描件后续接 OCR |
| Excel | 工作表、合并单元格、表头、字段、公式 |
| URL | 标题、正文、目录、附件、发布时间 |
| HTML/TXT | 正文清洗和结构识别 |

### 7.2 统一流水线

```text
上传或抓取
  ↓
病毒扫描、哈希、来源记录
  ↓
格式识别
  ↓
正文和表格解析
  ↓
统一文档模型
  ↓
章节、条款、字段、实体识别
  ↓
生成网页版本
  ↓
管理员审核
  ↓
切片、全文索引、Embedding
  ↓
发布
```

### 7.3 切片规则

- 制度：优先按章、节、条、款切分，保留章节路径和条款号。
- 报表：以报表、表单、字段、填报说明和校验规则为结构化对象。
- 处罚：按处罚事实、依据、措施和整改要求切分。
- 单片过短时与相邻片合并，单片过长时按语义段落继续拆分。
- 每个切片必须携带文档版本、来源、页码或字段定位。

## 8. 搜索与 RAG

### 8.1 混合检索

```text
问题解析
  ↓
权限和知识范围过滤
  ↓
PostgreSQL 全文/模糊检索
  ↓
pgvector 向量检索
  ↓
结果合并去重
  ↓
Rerank 重排序（可选）
  ↓
构造引用上下文
  ↓
调用用户选择的 Chat 模型
```

默认推荐：关键词 40%、向量 40%、重排序 20%。实际权重可通过系统配置调整。

### 8.2 知识范围

```text
全部知识
法规制度
监管报表
监管处罚
通用术语与标准
```

知识范围最终转换为 SQL/向量检索过滤条件，不能只依赖前端传入的展示值。

### 8.3 RAG 回答规则

系统提示词必须要求：

1. 只能基于提供的知识片段回答。
2. 不得编造文号、日期、金额、公式或制度口径。
3. 缺乏依据时明确说明。
4. 每个结论返回文档、版本、章节、条款或字段定位。
5. 发现版本差异时分别说明。
6. 明确 AI 回答不替代正式监管判断。

AI 返回结构：

```json
{
  "answer": "...",
  "confidence": "high|medium|low",
  "citations": [
    {
      "document_id": "uuid",
      "document_title": "...",
      "version_no": "...",
      "location": "第三章第十条",
      "chunk_id": "uuid",
      "score": 0.91,
      "url": "/knowledge/docs/uuid"
    }
  ],
  "warnings": []
}
```

## 9. 多模型网关

### 9.1 支持模型

- 千问 Qwen。
- DeepSeek。
- GLM/智谱。
- 自定义 OpenAI-compatible API。

### 9.2 Provider 接口

```python
class AIProvider(Protocol):
    async def chat(self, request: ChatRequest) -> ChatResponse: ...
    async def stream_chat(self, request: ChatRequest): ...
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
    async def rerank(self, query: str, documents: list[str]): ...
    async def health_check(self) -> HealthStatus: ...
```

业务模块只依赖 `AI Gateway`，不直接依赖任何一家模型厂商。

### 9.3 能力约束

- Chat 模型用于生成回答。
- Embedding 模型用于建立知识库向量，生产环境应固定版本。
- Rerank 模型用于召回结果排序，可选。
- 自定义 API 默认按 OpenAI-compatible 协议适配。
- API Key 只存后端，数据库加密，不返回前端，不写入普通日志。

## 10. API 设计

### 10.1 认证

```text
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
```

### 10.2 知识库

```text
GET  /api/knowledge/documents
GET  /api/knowledge/documents/{id}
POST /api/admin/documents/upload
POST /api/admin/documents/import-url
PUT  /api/admin/documents/{id}
POST /api/admin/documents/{id}/publish
POST /api/admin/documents/{id}/offline
GET  /api/admin/parsing-tasks/{id}
```

### 10.3 搜索

```text
GET /api/search?q=&scope=&agency=&region=&status=&date_from=&date_to=
GET /api/search/suggestions?q=
GET /api/search/filters
```

### 10.3.1 首页与管理概览统计

```text
GET /api/dashboard/stats
```

统计接口直接聚合数据库中的制度文档、报表、指标、术语、标准、处罚、年报、专题、解析任务和用户表，返回知识对象总量、制度近 7/30 日新增、待发布数量、处理中解析任务和用户数。首页与管理员管理概览共用该接口，不再维护前端静态统计数字。

### 10.4 报表和指标

```text
GET  /api/reports/systems
GET  /api/reports/{id}
GET  /api/reports/{id}/fields
GET  /api/reports/{id}/rules
POST /api/admin/reports
PUT  /api/admin/reports/{id}
POST /api/admin/metrics
PUT  /api/admin/metrics/{id}
```

### 10.4.1 术语、处罚、年报和专题内容

```text
GET  /api/knowledge/terms
POST /api/admin/terms
PUT  /api/admin/terms/{id}
GET  /api/analysis/penalties
POST /api/admin/penalties
PUT  /api/admin/penalties/{id}
GET  /api/analysis/annual-reports
POST /api/admin/annual-reports
PUT  /api/admin/annual-reports/{id}
GET  /api/research/topics
POST /api/admin/research/topics
PUT  /api/admin/research/topics/{id}
POST /api/admin/research/topics/{id}/relations
```

对应数据库表为 `terms`、`standards`、`penalty_cases`、`annual_reports`、`research_topics` 和 `topic_relations`。管理员新增内容先保存为草稿，经过关联、校验和发布后才对普通用户可见。

术语与标准新增表单中，分类固定为“国家标准、行业标准、监管指标、其他”；来源依据支持从已维护依据中选择，也支持管理员自定义录入。标准定义字段以富文本 HTML 保存，支持段落、加粗、斜体和列表，用于前端详情页和 AI 检索时保留语义结构。

### 10.4.2 批量导入与模板下载

后台所有支持批量导入的模块均提供与内容类型对应的无格式 Excel 模板。模板第一行保存稳定的内部字段名，第二行保存中文字段说明，数据从第三行开始填写；另有“字段说明”工作表描述字段含义、格式和必填要求。Excel 文件本身不承载展示样式，导入并通过字段校验后，由前端按照制度、处罚、报表、指标或专题的元素类型渲染。

支持的模板类型包括：`documents` 制度法规、`terms` 术语与标准、`penalties` 监管处罚、`annual` 年报披露、`topics` 专题研究、`reports` 报表配置、`metrics` 指标与释疑、`users` 用户管理。

- `GET /api/admin/content/template?content_type={type}`：下载对应 Excel 模板。
- `POST /api/admin/content/import`：上传 Excel、Word 或 PDF，创建内容解析任务；Excel 解析字段列、数据行和预览记录，Word/PDF 解析标题、正文和表格摘要。
- 导入任务先进入草稿区，后续由管理员校验、补充关联关系并提交发布；原文件保存在内容源记录中，可追溯和下载。

### 10.5 爬虫

```text
GET  /api/admin/crawlers
POST /api/admin/crawlers
PUT  /api/admin/crawlers/{id}
POST /api/admin/crawlers/{id}/run
GET  /api/admin/crawlers/{id}/runs
```

### 10.6 AI

```text
GET  /api/ai/models
GET  /api/ai/scopes
POST /api/ai/sessions
GET  /api/ai/sessions/{id}
POST /api/ai/sessions/{id}/messages
GET  /api/ai/messages/{id}/citations
```

### 10.7 文件纠错

```text
POST  /api/corrections
GET   /api/admin/corrections?status=
PATCH /api/admin/corrections/{id}
```

`POST /api/corrections` 接收资源类型、资源 ID、纠错类型、问题描述、当前内容、建议内容和依据链接；管理员查询接口按状态筛选，更新接口支持 `processing`、`resolved`、`rejected`，完成和驳回时写入处理时间及管理员说明。正式实现必须在服务端校验普通用户与管理员权限，不能仅依赖前端菜单隐藏。

## 11. 定时采集和异步任务

### 11.1 爬取策略

- 管理员配置固定 URL 目录。
- 默认每日执行一次，可手动执行。
- 通过 URL、标题、文号、发布时间和内容哈希去重。
- 新内容进入待审核，不直接发布。
- 页面不可访问、结构变化和解析失败写入任务错误。

### 11.2 任务状态

```text
queued → running → succeeded
                  ↘ failed → retrying
```

第一阶段可用数据库任务表和 APScheduler；正式部署使用 Redis + Worker。

## 12. 安全设计

- API 使用 HTTPS。
- 密码使用 Argon2 或 bcrypt 哈希。
- API Key 使用服务端密钥加密存储。
- 上传文件限制大小和 MIME 类型，执行病毒扫描。
- 所有下载链接使用短时效签名 URL。
- 管理员高风险操作需要二次确认。
- 审计日志不可由普通管理员直接修改或删除。
- 数据库、Redis、MinIO 不直接暴露公网。
- 日志脱敏，不记录密码、API Key 和完整用户问题中的敏感数据。

## 13. 本地和生产部署

### 13.1 本地开发

```text
React/Vite
FastAPI
PostgreSQL
本地 storage/ 目录
千问/DeepSeek/GLM API
```

Redis、MinIO 可暂缓；pgvector 未可用时，先使用全文检索开发业务接口。

### 13.2 Linux 服务器

```text
Nginx
  ↓
Frontend + FastAPI
  ↓
PostgreSQL + pgvector
Redis
MinIO 或云对象存储
Worker / Scheduler
  ↓
外部模型 API
```

推荐用 Docker Compose 管理服务，并通过 `.env` 注入配置。生产环境必须配置：

- 数据库每日备份和恢复演练。
- MinIO/S3 文件备份。
- API、任务、数据库和模型调用监控。
- 失败任务告警。
- 数据库迁移版本控制。

## 14. 配置示例

```env
APP_ENV=production
DATABASE_URL=postgresql+psycopg://app_user:***@postgres:5432/bank_regulatory
REDIS_URL=redis://redis:6379/0
STORAGE_BACKEND=minio
MINIO_ENDPOINT=minio:9000
QWEN_API_KEY=***
DEEPSEEK_API_KEY=***
GLM_API_KEY=***
```

模型配置写入数据库，API Key 通过密钥管理或加密字段保存；前端只读取启用模型的显示名称、能力和模型 ID。

## 15. 验收标准

### 15.1 数据和权限

- 普通用户无法调用管理员 API。
- 管理员上传、编辑、发布、下线和回滚均有审计记录。
- 文档原始文件、解析版本和发布版本可以互相追溯。
- 报表支持报送体系、报表、字段、规则、版本差异和制度依据五级关联。

### 15.2 搜索和 RAG

- 标题、文号、机构、报表代码和字段支持模糊搜索。
- 制度条款、字段释义和处罚正文支持全文检索。
- 向量检索返回切片来源、版本和定位。
- AI 回答必须返回引用；无依据时不得编造答案。
- 切换 Qwen、DeepSeek、GLM 或自定义 API 不改变知识库检索结果。

### 15.3 任务和采集

- 爬虫目录可新增、编辑、启停和手动执行。
- 每日任务支持失败重试和运行记录。
- 新抓取内容进入待审核状态。
- 解析任务展示进度、失败原因和重试入口。

### 15.4 性能目标

| 指标 | 目标 |
|---|---:|
| 普通列表接口 P95 | ≤ 500ms |
| 关键词搜索 P95 | ≤ 2s |
| 混合检索 P95 | ≤ 4s，不含模型生成 |
| AI 首字响应 | ≤ 8s，受外部 API 影响 |
| 正式内容来源覆盖率 | 100% |
| 发布操作审计覆盖率 | 100% |

## 16. 实施顺序

1. 建立 FastAPI 工程、数据库连接和 Alembic。
2. 创建用户、角色、审计和内容状态模型。
3. 创建知识文档、来源、版本、章节和附件模型。
4. 实现本地文件存储和 Word/PDF/Excel/URL 解析任务。
5. 实现制度库、报表库、指标库和处罚库 API。
6. 接入 PostgreSQL 全文检索和模糊搜索。
7. 在 Linux 服务器启用 pgvector，完成 Embedding 和向量检索。
8. 实现混合召回、Rerank 和引用生成。
9. 接入 Qwen、DeepSeek、GLM 和自定义 API。
10. 实现 Redis Worker、每日爬虫和失败重试。
11. 根据业务方提供的正式报表清单完善字段、规则和制度映射。
12. 完成测试、备份、监控和生产部署。

## 17. 关键决策总结

- 平台只保留管理员和普通用户两类角色。
- 报表采用配置化模型，具体清单待业务方提供。
- 采用 PostgreSQL + pgvector，不直接引入独立向量数据库。
- 采用混合检索，不依赖单一向量召回。
- AI 通过统一网关支持 Qwen、DeepSeek、GLM 和自定义 API。
- Embedding 模型由管理员配置并尽量保持稳定；Chat 模型允许用户选择。
- 原文、解析版、切片、向量和发布版本全部可追溯。
- 本地可以先不用 Redis 和 MinIO；Linux 生产环境建议启用。
- AI 只作为知识辅助工具，回答必须提供可定位引用，不替代正式监管判断。

