import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";
import * as schema from "./schema";

declare global {
  // Reuse the pool across hot reloads in development.
  // eslint-disable-next-line no-var
  var __dbfPool: Pool | undefined;
}

let _db: NodePgDatabase<typeof schema> | undefined;

export function db() {
  if (!_db) {
    const pool = globalThis.__dbfPool ?? new Pool({ connectionString: env.databaseUrl, max: 10 });
    if (!env.isProduction) globalThis.__dbfPool = pool;
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
