import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "wildx-offline.db";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS offline_report (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  body TEXT NOT NULL,
  photo_uri TEXT,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error TEXT
);
`;

let database: SQLiteDatabase | null = null;

export function offlineDb(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync(DATABASE_NAME);
    database.execSync(SCHEMA);
  }
  return database;
}
