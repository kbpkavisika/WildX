import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "wildx.db";

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  patrol_id INTEGER,
  target_id INTEGER,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  photo_uri TEXT,
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error TEXT
);
CREATE INDEX IF NOT EXISTS outbox_user_status ON outbox (user_id, status);
`;

let database: SQLiteDatabase | null = null;

export function db(): SQLiteDatabase {
  if (!database) {
    database = openDatabaseSync(DATABASE_NAME);
    database.execSync(SCHEMA);
  }
  return database;
}
