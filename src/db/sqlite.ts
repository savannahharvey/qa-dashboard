import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getSqlitePath } from "./databaseUrl.js";

export function openDatabase(databaseUrl?: string) {
  const databasePath = getSqlitePath(databaseUrl);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");

  return database;
}

export const db = openDatabase();
