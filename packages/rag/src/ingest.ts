import type { RepoSource } from "@codebase-explainer/shared";
import { Octokit } from "@octokit/rest";

export type IngestedFile = {
  path: string;
  content: string;
  sha: string;
  size: number;
};

export type IngestResult = {
  repoId: string;
  fileCount: number;
  files: IngestedFile[];
};

const MAX_FILE_SIZE = 512 * 1024;

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".html",
  ".css",
  ".scss",
  ".prisma",
  ".sql",
  ".toml",
  ".env",
]);

const IGNORE_PREFIXES = [
  "node_modules/",
  "dist/",
  "build/",
  "vendor/",
  ".git/",
];

const IGNORE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "go.sum",
  "Cargo.lock",
]);

function shouldIgnore(path: string) {
  if (IGNORE_FILES.has(path)) return true;
  return IGNORE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isTextFile(path: string) {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return false;
  return TEXT_EXTENSIONS.has(path.slice(dot));
}

export async function ingestRepo(
  source: RepoSource,
  options?: { token?: string }
): Promise<IngestResult> {
  const repoId = `${source.owner}/${source.name}`;
  const startedAt = Date.now();
  const log = (message: string) => {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[ingest ${repoId}] +${elapsed}s ${message}`);
  };
  const octokit = new Octokit({
    auth: options?.token ?? Bun.env.GITHUB_TOKEN,
  });

  const branch = source.branch ?? "main";
  const ref = `heads/${branch}`;

  log(`fetching ref ${ref}`);
  const refInfo = await octokit.git.getRef({
    owner: source.owner,
    repo: source.name,
    ref,
  });

  const treeSha = refInfo.data.object.sha;
  log(`fetching tree ${treeSha}`);
  const tree = await octokit.git.getTree({
    owner: source.owner,
    repo: source.name,
    tree_sha: treeSha,
    recursive: "true",
  });

  const files: IngestedFile[] = [];
  let processed = 0;
  let fetched = 0;
  for (const item of tree.data.tree) {
    processed += 1;
    if (item.type !== "blob" || !item.path || !item.sha) continue;
    if (shouldIgnore(item.path)) continue;
    if (!isTextFile(item.path)) continue;
    if (item.size && item.size > MAX_FILE_SIZE) continue;

    const blob = await octokit.git.getBlob({
      owner: source.owner,
      repo: source.name,
      file_sha: item.sha,
    });

    const content = Buffer.from(blob.data.content, "base64").toString("utf8");

    files.push({
      path: item.path,
      content,
      sha: item.sha,
      size: item.size ?? content.length,
    });

    fetched += 1;
    if (fetched % 50 === 0) {
      log(`fetched ${fetched} files (processed ${processed}/${tree.data.tree.length})`);
    }
  }

  log(`done: ${files.length} files`);
  return {
    repoId,
    fileCount: files.length,
    files,
  };
}
