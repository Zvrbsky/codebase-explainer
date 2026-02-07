CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  path TEXT NOT NULL,
  language TEXT,
  symbol TEXT,
  start_line INT,
  end_line INT,
  content TEXT NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  embedding vector(3072)
);

CREATE INDEX IF NOT EXISTS rag_chunks_repo_idx ON rag_chunks (repo_id);
CREATE INDEX IF NOT EXISTS rag_chunks_path_idx ON rag_chunks (path);
CREATE INDEX IF NOT EXISTS rag_chunks_tsv_idx ON rag_chunks USING GIN (content_tsv);
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops);
