import type { DatabaseSync } from "node:sqlite";
import type { Pool } from "pg";
import { getDatabaseProvider, getDatabaseUrl } from "./databaseUrl.js";
import { openPostgresPool } from "./postgres.js";
import { createPostgresRepository, createSqliteRepository } from "./repository.js";
import { openDatabase } from "./sqlite.js";

const databaseUrl = getDatabaseUrl();
const provider = getDatabaseProvider(databaseUrl);

let sqliteDb: DatabaseSync | undefined;
let postgresPool: Pool | undefined;

export const repository =
  provider === "postgres"
    ? createPostgresRepository((postgresPool = openPostgresPool(databaseUrl)))
    : createSqliteRepository((sqliteDb = openDatabase(databaseUrl)));

export async function closeDatabase() {
  sqliteDb?.close();
  await postgresPool?.end();
}
