import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool() {
  if (!pool) {
    const connectionString = Bun.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}
