import { randomUUID } from "expo-crypto";
import { db } from "@/lib/db/database";
import { OUTBOX_STATUSES, type NewOutboxItem, type OutboxKind, type OutboxRow, type OutboxStatus } from "./types";

interface OutboxRecord {
  id: string;
  user_id: number;
  kind: OutboxKind;
  patrol_id: number | null;
  target_id: number | null;
  label: string;
  body: string;
  photo_uri: string | null;
  created_at: number;
  status: OutboxStatus;
  error: string | null;
}

function toRow(record: OutboxRecord): OutboxRow {
  return {
    id: record.id,
    userId: record.user_id,
    kind: record.kind,
    patrolId: record.patrol_id,
    targetId: record.target_id,
    label: record.label,
    body: record.body,
    photoUri: record.photo_uri,
    createdAt: record.created_at,
    status: record.status,
    error: record.error,
  };
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

export function insertRow(userId: number, item: NewOutboxItem): string {
  const id = item.id ?? randomUUID();
  db().runSync(
    "INSERT INTO outbox (id, user_id, kind, patrol_id, target_id, label, body, photo_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    userId,
    item.kind,
    item.patrolId ?? null,
    item.targetId ?? null,
    item.label,
    JSON.stringify(item.body),
    item.photoUri ?? null,
    Date.now(),
  );
  return id;
}

export function rowsOf(userId: number): OutboxRow[] {
  return db().getAllSync<OutboxRecord>("SELECT * FROM outbox WHERE user_id = ? ORDER BY rowid", userId).map(toRow);
}

export function pendingRowsOf(userId: number): OutboxRow[] {
  return db()
    .getAllSync<OutboxRecord>("SELECT * FROM outbox WHERE user_id = ? AND status = ? ORDER BY rowid", userId, OUTBOX_STATUSES.PENDING)
    .map(toRow);
}

export function deleteRows(ids: string[]): void {
  if (ids.length === 0) return;
  db().runSync(`DELETE FROM outbox WHERE id IN (${placeholders(ids.length)})`, ids);
}

export function rejectRows(ids: string[], error: string): void {
  if (ids.length === 0) return;
  db().runSync(`UPDATE outbox SET status = ?, error = ? WHERE id IN (${placeholders(ids.length)})`, [
    OUTBOX_STATUSES.REJECTED,
    error,
    ...ids,
  ]);
}

export function countAttempt(ids: string[]): void {
  if (ids.length === 0) return;
  db().runSync(`UPDATE outbox SET attempts = attempts + 1 WHERE id IN (${placeholders(ids.length)})`, ids);
}
