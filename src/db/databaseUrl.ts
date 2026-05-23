import path from "node:path";

export type DatabaseProvider = "sqlite" | "postgres";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? "file:./data/dev.db";
}

export function getDatabaseProvider(databaseUrl = getDatabaseUrl()): DatabaseProvider {
  if (databaseUrl.startsWith("file:")) {
    return "sqlite";
  }

  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    return "postgres";
  }

  throw new Error("DATABASE_URL must start with file:, postgresql://, or postgres://.");
}

export function getSqlitePath(databaseUrl = getDatabaseUrl()) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only file: SQLite DATABASE_URL values are supported.");
  }

  const filePath = databaseUrl.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}
