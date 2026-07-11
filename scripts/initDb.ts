import fs from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import { getDatabaseUrl } from "../src/db/databaseUrl.js";
import { openPostgresPool } from "../src/db/postgres.js";

const databaseUrl = getDatabaseUrl();

async function applyPostgresSchema(pool: Pool) {
  await pool.query(fs.readFileSync(path.resolve(process.cwd(), "db/migrations/20260509125500_init/postgres.sql"), "utf8"));
}

const pool = openPostgresPool(databaseUrl);

try {
  await applyPostgresSchema(pool);
  console.log("PostgreSQL schema applied.");
} finally {
  await pool.end();
}
