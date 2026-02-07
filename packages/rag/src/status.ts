import { getDbPool } from "./db";

export type RepoStatus = {
  repoId: string;
  chunkCount: number;
};

export async function getRepoStatus(repoId: string): Promise<RepoStatus> {
  const pool = getDbPool();
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM rag_chunks WHERE repo_id = $1",
    [repoId]
  );
  return {
    repoId,
    chunkCount: result.rows[0]?.count ?? 0,
  };
}
