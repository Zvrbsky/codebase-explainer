import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`API running on http://localhost:${port}`);
