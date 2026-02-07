import type { Chunk } from "./chunk";
import { getDbPool } from "./db";
import { embedTexts } from "./embeddings";

export type StoreResult = {
  stored: number;
};

export async function storeChunks(
  repoId: string,
  chunks: Chunk[]
): Promise<StoreResult> {
  if (chunks.length === 0) return { stored: 0 };

  const pool = getDbPool();
  const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const embedding = embeddings[i]?.vector ?? null;
      const vectorSql = embedding ? `[${embedding.join(",")}]` : null;
      await client.query(
        `
        INSERT INTO rag_chunks (
          id, repo_id, path, language, symbol, start_line, end_line, content, embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
        ON CONFLICT (id) DO UPDATE
        SET content = EXCLUDED.content,
            language = EXCLUDED.language,
            symbol = EXCLUDED.symbol,
            start_line = EXCLUDED.start_line,
            end_line = EXCLUDED.end_line,
            embedding = EXCLUDED.embedding
        `,
        [
          chunk.id,
          repoId,
          chunk.metadata.path,
          chunk.metadata.language ?? null,
          chunk.metadata.symbol ?? null,
          chunk.metadata.startLine ?? null,
          chunk.metadata.endLine ?? null,
          chunk.content,
          vectorSql,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { stored: chunks.length };
}
