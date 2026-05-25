import "dotenv/config";

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set to a PostgreSQL connection string.");
  }
  return url;
}

export type DatabaseProvider = "postgres";

export function getDatabaseProvider(databaseUrl = getDatabaseUrl()): DatabaseProvider {
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    return "postgres";
  }

  throw new Error("DATABASE_URL must start with postgresql:// or postgres://.");
}
