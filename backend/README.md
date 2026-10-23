# 银规智库后端

## 本地启动

```powershell
.\.venv\Scripts\Activate.ps1
python -m scripts.init_db
uvicorn app.main:app --reload --port 8000
```

### 导入原型样例数据

将当前前端原型中的代表性制度、报表、指标、术语、处罚、机构、年报、专题、用户和解析任务写入当前配置的数据库：

```powershell
python -m scripts.seed_demo
python -m scripts.export_seed
```

`seed_demo` 使用业务编码、文号、报表编码、指标编码和用户名等稳定键，重复执行不会重复插入。`export_seed` 会生成 `seed/local_seed.json`，该文件可提交到 GitHub，并在生产环境执行：

```powershell
python -m scripts.import_seed --file seed/local_seed.json
```

首页和管理概览通过 `/api/dashboard/stats` 读取数据库实际数量；初始化真实业务文件后，统计数据会随正式数据变化。

## 监管处罚定时爬取

已配置 Iweicha、人民银行和国家外汇管理局三个监管处罚案例目录，每日上海时间 02:00 执行一次：

```powershell
python scripts/configure_iweicha_crawler.py
python scripts/run_crawlers.py
```

首次执行会发现目录详情页、提取处罚对象/违法事实/处罚决定/处罚机关/日期/金额，并以 `draft` 状态写入 `penalty_cases`；源页面 URL 和 HTML 快照写入 `content_sources` 及 `storage/snapshots/crawler/`。重复执行按处罚文号或详情 URL 更新，不重复新增。

本机已注册 Windows 任务计划：`Bank Regulatory Knowledge - Iweicha Penalty Crawler`。生产 Linux 环境可将 `python scripts/run_crawlers.py` 配置为每日 cron 或 Kubernetes CronJob。

如果使用 PostgreSQL，请先复制 `.env.example` 为 `.env`，填写 `DATABASE_URL`。本地未配置 PostgreSQL 密码时，默认使用 SQLite 进行接口开发；生产环境必须使用 PostgreSQL。

## 初始化数据

制度文档和监管报表暂不内置业务数据。管理员提供 PDF、Word、Excel 后，通过 `/api/admin/initialization/upload` 上传，后续解析任务会生成正式数据。

```powershell
python -m scripts.export_seed
```

`seed/` 中的 JSON 和解析后的本地文件可作为部署前的迁移输入。生产环境导入前应经过管理员审核。

```powershell
python -m scripts.import_seed --file seed/local_seed.json
```

Linux PostgreSQL 需要先执行 `sql/001_postgres_extensions.sql`。其中 `vector` 的维度必须和实际选定的 Embedding 模型一致。

## 生产部署

生产环境启用 PostgreSQL + pgvector、Redis、MinIO，并将 Qwen、DeepSeek、GLM 或自定义 API 配置写入服务端环境变量或加密配置中心。
