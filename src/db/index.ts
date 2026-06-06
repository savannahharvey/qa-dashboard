import type { Pool } from "pg";
import { getDatabaseUrl } from "./databaseUrl.js";
import { openPostgresPool } from "./postgres.js";
import { createPostgresRepository } from "./repository.js";

const databaseUrl = getDatabaseUrl();

let postgresPool: Pool | undefined;

export const repository = createPostgresRepository((postgresPool = openPostgresPool(databaseUrl)));

export async function verifyDatabaseConnection() {
  await postgresPool?.query("SELECT 1");
}

export async function closeDatabase() {
  await postgresPool?.end();
}
