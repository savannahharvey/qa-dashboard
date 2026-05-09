import path from "node:path";

export function getSqlitePath(databaseUrl = process.env.DATABASE_URL ?? "file:./data/dev.db") {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only file: SQLite DATABASE_URL values are supported.");
  }

  const filePath = databaseUrl.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}
