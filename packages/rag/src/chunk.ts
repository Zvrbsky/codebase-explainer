import type { ChunkMetadata } from "@codebase-explainer/shared";

export type Chunk = {
  id: string;
  content: string;
  metadata: ChunkMetadata;
};

const MAX_CHUNK_LINES = 200;

const EXTENSION_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".md": "markdown",
};

type Boundary = { line: number; symbol?: string };

function getLanguage(path: string) {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return undefined;
  return EXTENSION_LANGUAGE[path.slice(dot)];
}

function findFunctionBoundaries(path: string, lines: string[]): Boundary[] {
  const language = getLanguage(path);
  if (!language) return [];

  const boundaries: Boundary[] = [];

  const patterns =
    language === "python"
      ? [/^def\s+([A-Za-z0-9_]+)/, /^class\s+([A-Za-z0-9_]+)/]
      : [
          /^export\s+function\s+([A-Za-z0-9_]+)/,
          /^function\s+([A-Za-z0-9_]+)/,
          /^export\s+class\s+([A-Za-z0-9_]+)/,
          /^class\s+([A-Za-z0-9_]+)/,
        ];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        boundaries.push({ line: index + 1, symbol: match[1] });
        break;
      }
    }
  });

  return boundaries;
}

function chunkByLineWindow(
  path: string,
  content: string,
  startLine: number,
  endLine: number,
  symbol?: string
): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];
  let windowStart = startLine;

  while (windowStart <= endLine) {
    const windowEnd = Math.min(windowStart + MAX_CHUNK_LINES - 1, endLine);
    const slice = lines.slice(windowStart - 1, windowEnd).join("\n");
    const id = `${path}:${windowStart}-${windowEnd}`;

    chunks.push({
      id,
      content: slice,
      metadata: {
        repo: "",
        path,
        language: getLanguage(path),
        symbol,
        startLine: windowStart,
        endLine: windowEnd,
      },
    });

    windowStart = windowEnd + 1;
  }

  return chunks;
}

export function chunkText(path: string, content: string): Chunk[] {
  const lines = content.split("\n");
  const boundaries = findFunctionBoundaries(path, lines);
  const chunks: Chunk[] = [];

  if (boundaries.length === 0) {
    return chunkByLineWindow(path, content, 1, lines.length);
  }

  for (let i = 0; i < boundaries.length; i += 1) {
    const start = boundaries[i].line;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].line - 1 : lines.length;
    chunks.push(
      ...chunkByLineWindow(path, content, start, end, boundaries[i].symbol)
    );
  }

  return chunks;
}
