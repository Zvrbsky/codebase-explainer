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
- Framework: Next.js (App Router) + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Auth: NextAuth.js (GitHub OAuth)

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

### Frontend (Next.js)
The frontend app will live in `apps/web`. Once it is scaffolded:
1. Install dependencies:
   - `bun install`
2. Run the web app:
   - `bun run dev:web`
3. Open:
   - `http://localhost:3000`

## Open Decisions
- Separate backend vs. Next.js API routes.
- Reranker model choice and hosting.
- Code chunk size and overlap.
