const port = Number(Bun.env.WEB_PORT ?? 3000);
const apiBase = Bun.env.API_BASE_URL ?? "http://localhost:3001";

Bun.serve({
  port,
  routes: {
    "/": new Response(
      await Bun.file("apps/web/index.html").text().then((html) =>
        html.replace("__API_BASE_URL__", apiBase)
      ),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    ),
    "/app.js": new Response(
      await Bun.file("apps/web/app.js").text().then((text) =>
        text.replace("__API_BASE_URL__", apiBase)
      ),
      {
        headers: { "Content-Type": "text/javascript; charset=utf-8" },
      }
    ),
    "/styles.css": Bun.file("apps/web/styles.css"),
    "/assets/favicon.svg": Bun.file("apps/web/assets/favicon.svg"),
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Web UI running on http://localhost:${port}`);
