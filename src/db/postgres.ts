import { Pool } from "pg";
import { getDatabaseUrl } from "./databaseUrl.js";

export function openPostgresPool(databaseUrl = getDatabaseUrl()) {
  return new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX ?? 10),
  });
}
