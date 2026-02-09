const apiBase = process.env.API_BASE_URL ?? "http://localhost:3001";

const srcDir = "apps/web";
const outDir = "apps/web/dist";

await Bun.write(
  `${outDir}/index.html`,
  (await Bun.file(`${srcDir}/index.html`).text()).replace(
    "__API_BASE_URL__",
    apiBase
  )
);

await Bun.write(
  `${outDir}/app.js`,
  (await Bun.file(`${srcDir}/app.js`).text()).replace(
    "__API_BASE_URL__",
    apiBase
  )
);
await Bun.write(`${outDir}/styles.css`, Bun.file(`${srcDir}/styles.css`));
await Bun.write(
  `${outDir}/assets/favicon.svg`,
  Bun.file(`${srcDir}/assets/favicon.svg`)
);
