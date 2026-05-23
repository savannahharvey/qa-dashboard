import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openPostgresPool } from "../src/db/postgres.js";
import { getDatabaseProvider, getDatabaseUrl, getSqlitePath } from "../src/db/databaseUrl.js";

const targetUrl = getDatabaseUrl();
if (getDatabaseProvider(targetUrl) !== "postgres") {
  throw new Error("Set DATABASE_URL to the target PostgreSQL/RDS connection string before running this migration.");
}

const sourceUrl = process.env.SOURCE_SQLITE_DATABASE_URL ?? "file:./data/dev.db";
const sourcePath = getSqlitePath(sourceUrl);
if (!fs.existsSync(sourcePath)) {
  throw new Error(`SQLite source database not found: ${sourcePath}`);
}

const sqlite = new DatabaseSync(sourcePath);
const postgres = openPostgresPool(targetUrl);

await postgres.query(fs.readFileSync(path.resolve(process.cwd(), "db/migrations/20260509125500_init/postgres.sql"), "utf8"));

const tables = [
  { name: "User", columns: ["id", "username", "displayName", "passwordHash", "createdAt", "updatedAt"], conflict: ["id"] },
  { name: "Team", columns: ["id", "name", "joinCode", "createdAt", "updatedAt"], conflict: ["id"] },
  { name: "TeamMembership", columns: ["userId", "teamId"], conflict: ["userId", "teamId"] },
  { name: "TestSuite", columns: ["id", "teamId", "category", "name", "source", "enabled", "createdAt", "updatedAt"], conflict: ["id"] },
  {
    name: "Goal",
    columns: [
      "id",
      "teamId",
      "ownerId",
      "scope",
      "parentGoalId",
      "title",
      "description",
      "metricType",
      "testCategory",
      "currentValue",
      "targetValue",
      "unit",
      "dueDate",
      "status",
      "createdAt",
      "updatedAt",
    ],
    conflict: ["id"],
  },
  {
    name: "QaMetric",
    columns: ["id", "teamId", "testSuiteId", "category", "kind", "status", "value", "unit", "source", "measuredAt", "createdAt", "updatedAt"],
    conflict: ["id"],
  },
  { name: "MetricSourceConfig", columns: ["id", "teamId", "source", "settings", "enabled", "createdAt", "updatedAt"], conflict: ["id"] },
] as const;

for (const table of tables) {
  const rows = sqlite.prepare(`SELECT ${table.columns.map((column) => `"${column}"`).join(", ")} FROM "${table.name}"`).all() as Array<Record<string, unknown>>;
  for (const row of rows) {
    await postgres.query(buildUpsert(table.name, table.columns, table.conflict), table.columns.map((column) => normalizeValue(column, row[column])));
  }

  console.log(`Migrated ${rows.length} row(s) from ${table.name}.`);
}

sqlite.close();
await postgres.end();

function buildUpsert(table: string, columns: readonly string[], conflict: readonly string[]) {
  const quotedColumns = columns.map((column) => `"${column}"`);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const updates = columns
    .filter((column) => !conflict.includes(column))
    .map((column) => `"${column}" = excluded."${column}"`);

  return `INSERT INTO "${table}" (${quotedColumns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON CONFLICT (${conflict.map((column) => `"${column}"`).join(", ")})
    ${updates.length > 0 ? `DO UPDATE SET ${updates.join(", ")}` : "DO NOTHING"}`;
}

function normalizeValue(column: string, value: unknown) {
  if ((column === "enabled") && typeof value === "number") {
    return value === 1;
  }

  return value;
}
