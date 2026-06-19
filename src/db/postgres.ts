import { Pool } from "pg";
import { getDatabaseUrl } from "./databaseUrl.js";

function parseSslOption(databaseUrl: string) {
  try {
    const u = new URL(databaseUrl);
    const sslParam = u.searchParams.get("ssl") ?? u.searchParams.get("sslmode");
    if (sslParam) {
      const v = sslParam.toLowerCase();
      if (v === "1" || v === "true" || v === "require" || v === "verify-ca" || v === "verify-full") {
        return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" };
      }
      if (v === "0" || v === "false" || v === "disable") {
        return false;
      }
    }
  } catch (e) {
    // ignore parse errors and fall through to env-based checks
  }

  // Allow explicit env override. Set DB_SSL to "true" or "false".
  if (typeof process.env.DB_SSL !== "undefined") {
    const env = process.env.DB_SSL.toLowerCase();
    if (env === "true" || env === "1") return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" };
    if (env === "false" || env === "0") return false;
  }

  // Default: leave undefined so node-postgres decides. Returning undefined avoids forcing TLS.
  return undefined;
}

export function openPostgresPool(databaseUrl = getDatabaseUrl()) {
  const ssl = parseSslOption(databaseUrl);
  return new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    ...(typeof ssl !== "undefined" ? { ssl } : {}),
  });
}
