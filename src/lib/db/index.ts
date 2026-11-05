import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/** Satu pool per proses. Di dev disimpan di globalThis agar hot reload tidak membuka koneksi baru terus. */
const g = globalThis as unknown as { bomaPool?: Pool };

// Pool belum membuka koneksi sampai query pertama, jadi aman dibuat saat `next build` (tanpa env).
function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, statement_timeout: 15_000 });
}

export const pool = g.bomaPool ?? createPool();
if (process.env.NODE_ENV !== "production") g.bomaPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export { schema };
