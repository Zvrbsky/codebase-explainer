import type { Chunk } from "./chunk";
import { getDbPool } from "./db";
import { embedTexts } from "./embeddings";

export type RetrieveQuery = {
  query: string;
  repoId: string;
  topK?: number;
};

type RankedChunk = Chunk & { score: number };

function mergeRanked(vector: RankedChunk[], keyword: RankedChunk[], limit: number) {
  const map = new Map<string, RankedChunk>();
  const push = (item: RankedChunk) => {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      existing.score = Math.max(existing.score, item.score);
    }
  };
  vector.forEach(push);
  keyword.forEach(push);
  return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function retrieveChunks(input: RetrieveQuery): Promise<Chunk[]> {
  const pool = getDbPool();
  const topK = input.topK ?? 8;
  const [embeddingResult] = await embedTexts([input.query]);

  const vectorQuery = embeddingResult?.vector
    ? `
    SELECT id, repo_id, path, language, symbol, start_line, end_line, content,
           1 - (embedding <=> $1) AS score
    FROM rag_chunks
    WHERE repo_id = $2 AND embedding IS NOT NULL
    ORDER BY embedding <=> $1
    LIMIT $3
  `
    : null;

  const keywordQuery = `
    SELECT id, repo_id, path, language, symbol, start_line, end_line, content,
           ts_rank(content_tsv, plainto_tsquery('simple', $1)) AS score
    FROM rag_chunks
    WHERE repo_id = $2 AND content_tsv @@ plainto_tsquery('simple', $1)
    ORDER BY score DESC
    LIMIT $3
  `;

  const vectorResult = vectorQuery
    ? await pool.query(vectorQuery, [
        `[${embeddingResult.vector.join(",")}]`,
        input.repoId,
        topK,
      ])
    : { rows: [] };
  const keywordResult = await pool.query(keywordQuery, [
    input.query,
    input.repoId,
    topK,
  ]);

  const toChunk = (row: any): RankedChunk => ({
    id: row.id,
    content: row.content,
    metadata: {
      repo: row.repo_id,
      path: row.path,
      language: row.language ?? undefined,
      symbol: row.symbol ?? undefined,
      startLine: row.start_line ?? undefined,
      endLine: row.end_line ?? undefined,
    },
    score: Number(row.score ?? 0),
  });

  const merged = mergeRanked(
    vectorResult.rows.map(toChunk),
    keywordResult.rows.map(toChunk),
    topK
  );

  return merged.map(({ score: _score, ...chunk }) => chunk);
}
