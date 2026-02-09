# AI Codebase Explainer Agent (RAG)

Specification for a RAG-based agent that explains software codebases to recruiters and developers.

## Goals
- Upload a GitHub repo and ask questions about architecture and flows.
- Return answers with citations to specific files.
- Demonstrate RAG, tool-calling, and multi-step reasoning.

## Core User Flows
- Connect a GitHub repo (public or private via token).
- Index code and docs into a searchable knowledge base.
- Ask questions and get grounded, cited answers.
- Follow-up questions refine context without re-uploading.

## Tech Stack (Initial)
### Frontend
- Runtime: Bun (static UI)
- UI: HTML + CSS + vanilla JS

### Backend / API
- Runtime: Bun
- Framework: Hono
- Language: TypeScript
- Orchestration: LangChain.js
- Repo ingestion: GitHub REST API (octokit)
- File parsing: tree-sitter + simple text parsers for Markdown

### RAG Pipeline
- Chunking: file-aware + function-level (tree-sitter)
- Metadata: file path, language, module, symbol name
- Embeddings: OpenAI `text-embedding-3-large`
- Vector DB: Postgres + pgvector
- Retrieval: hybrid (vector + BM25)
- Rerank: optional cross-encoder (e.g., bge-reranker)
- LLM: OpenAI `gpt-4.1` for answers with citations
- RAG framework: LangChain.js (retrievers, chains, tool calling)

### Agent Tools
- `search_code(query, filters)`
- `summarize_file(path)`
- `list_files()`
- `get_file(path, range)`

## Non-Functional Requirements
- Fast indexing for medium repos (<500 files).
- Guardrails against hallucinations (cite-only policy).
- Caching for embeddings and summaries.
- Minimal latency for Q&A (<6s target).

## Milestones
- MVP: upload repo, index, ask questions, cite files.
- v1: hybrid retrieval + tool-calling agent.
- v2: user projects, saved conversations, private repos.

## Local Development
### Docker (DB + API)
1. Copy env template:
   - `cp .env.example .env`
2. Update `.env` with your keys.
3. Start services:
   - `docker compose up`

### Backend (Bun + Hono)
1. Install dependencies:
   - `bun install`
2. Run the API:
   - `bun run dev:api`
3. Health check:
   - `GET http://localhost:3001/health`

### API Test Commands (curl)
1. Health:
   - `curl -s http://localhost:3001/health`
2. Ingest a repo:
   - `curl -s -X POST http://localhost:3001/repos/ingest \`
     `-H "Content-Type: application/json" \`
     `-d '{"owner":"vercel","name":"next.js","branch":"canary"}'`
3. Check repo status:
   - `curl -s http://localhost:3001/repos/vercel%2Fnext.js/status`
4. Ask a question:
   - `curl -s -X POST http://localhost:3001/chat \`
     `-H "Content-Type: application/json" \`
     `-d '{"repoId":"vercel/next.js","question":"Where is the routing handled?"}'`

### Frontend (Bun UI)
The minimal UI is served via Bun:
1. Run the web app:
   - `bun run dev:web`
2. Open:
   - `http://localhost:3000`
3. Configure API base URL in `.env`:
   - `API_BASE_URL=http://localhost:3001`
4. Configure CORS origins in `.env` (comma-separated):
   - `CORS_ORIGINS=http://localhost:3000`

## Open Decisions
- Reranker model choice and hosting.
- Code chunk size and overlap.
