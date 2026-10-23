-- Run this on the Linux PostgreSQL database before enabling vector retrieval.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- The first model migration stores embeddings as text for SQLite/local bootstrap.
-- On PostgreSQL, replace it with the dimension of the configured Qwen embedding model.
-- Example: ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(1536)
-- USING embedding::vector;

CREATE INDEX IF NOT EXISTS ix_knowledge_documents_title_trgm
  ON knowledge_documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_knowledge_documents_code_trgm
  ON knowledge_documents USING gin (document_code gin_trgm_ops);
