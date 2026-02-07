import { Hono } from "hono";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import {
  chunkText,
  getRepoStatus,
  ingestRepo,
  retrieveChunks,
  storeChunks,
} from "@codebase-explainer/rag";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

const ingestSchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  branch: z.string().min(1).optional(),
});

app.post("/repos/ingest", async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid or empty JSON body" }, 400);
  }
  const body = ingestSchema.safeParse(payload);
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }

  const result = await ingestRepo(body.data);
  const chunks = result.files.flatMap((file) =>
    chunkText(file.path, file.content).map((chunk) => ({
      ...chunk,
      metadata: { ...chunk.metadata, repo: result.repoId },
    }))
  );
  const stored = await storeChunks(result.repoId, chunks);

  return c.json({
    repoId: result.repoId,
    fileCount: result.fileCount,
    chunkCount: chunks.length,
    stored: stored.stored,
  });
});

const chatSchema = z.object({
  repoId: z.string().min(1),
  question: z.string().min(1),
});

app.post("/chat", async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid or empty JSON body" }, 400);
  }
  const body = chatSchema.safeParse(payload);
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }

  const chunks = await retrieveChunks({
    repoId: body.data.repoId,
    query: body.data.question,
    topK: 6,
  });

  if (chunks.length === 0) {
    return c.json({
      answer:
        "No relevant context was found for that question in this repo. Try a different query or verify the repoId.",
      citations: [],
    });
  }

  const MAX_CHUNK_CHARS = 1500;
  const MAX_CONTEXT_CHARS = 8000;
  let total = 0;
  const contextParts: string[] = [];

  for (const chunk of chunks) {
    const content =
      chunk.content.length > MAX_CHUNK_CHARS
        ? `${chunk.content.slice(0, MAX_CHUNK_CHARS)}\n...[truncated]`
        : chunk.content;
    const part = `FILE: ${chunk.metadata.path}\n${content}`;
    if (total + part.length > MAX_CONTEXT_CHARS) break;
    contextParts.push(part);
    total += part.length;
  }

  const context = contextParts.join("\n\n---\n\n");

  const model = new ChatOpenAI({
    modelName: "gpt-4.1",
    temperature: 0.2,
  });

  const response = await model.invoke([
    [
      "system",
      "Answer using only the provided context and include citations with file paths.",
    ],
    ["user", `Question: ${body.data.question}\n\nContext:\n${context}`],
  ]);

  const answer = typeof response.content === "string" ? response.content : "";

  return c.json({
    answer,
    citations: chunks.map((chunk) => ({
      path: chunk.metadata.path,
      snippet: chunk.content.slice(0, 400),
    })),
  });
});

app.get("/repos/:id/status", async (c) => {
  const repoId = c.req.param("id");
  const status = await getRepoStatus(repoId);
  return c.json(status);
});

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`API running on http://localhost:${port}`);
