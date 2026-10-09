import { File } from "expo-file-system";
import { isRetryable, isUnauthorized } from "@/lib/api/client";
import { useSession } from "@/lib/auth/store";
import { queryClient } from "@/lib/query-client";
import { countAttempt, deleteRows, insertRow, pendingRowsOf, rejectRows } from "./repository";
import { nextBatch, queryKeysFor, sendBatch } from "./send";
import { markSynced, refreshOutbox, useConnection, useOutbox } from "./store";
import type { NewOutboxItem, OutboxRow } from "./types";

let running: Promise<void> | null = null;

function deletePhotos(rows: OutboxRow[]): void {
  rows.forEach((row) => {
    if (!row.photoUri) return;
    const photo = new File(row.photoUri);
    if (photo.exists) photo.delete();
  });
}

export function discardRows(rows: OutboxRow[]): void {
  deletePhotos(rows);
  deleteRows(rows.map((row) => row.id));
  refreshOutbox();
}

async function refreshQueries(row: OutboxRow): Promise<void> {
  await Promise.all(queryKeysFor(row).map((queryKey) => queryClient.invalidateQueries({ queryKey }).catch(() => undefined)));
}

async function deliver(batch: OutboxRow[]): Promise<boolean> {
  const ids = batch.map((row) => row.id);
  try {
    await sendBatch(batch);
  } catch (error) {
    if (isUnauthorized(error) || isRetryable(error)) {
      countAttempt(ids);
      return false;
    }
    rejectRows(ids, error instanceof Error ? error.message : "Rejected by the server");
    refreshOutbox();
    return true;
  }
  await refreshQueries(batch[0]);
  discardRows(batch);
  markSynced();
  return true;
}

async function drain(): Promise<void> {
  const { user, token } = useSession.getState();
  if (!user || !token || !useConnection.getState().online) return;
  useOutbox.setState({ syncing: true });
  try {
    for (;;) {
      const batch = nextBatch(pendingRowsOf(user.id));
      if (batch.length === 0) {
        markSynced();
        return;
      }
      if (!(await deliver(batch))) return;
    }
  } finally {
    useOutbox.setState({ syncing: false });
    refreshOutbox();
  }
}

export function syncNow(): Promise<void> {
  running ??= drain().finally(() => {
    running = null;
  });
  return running;
}

export function saveForUser(userId: number, item: NewOutboxItem): string {
  const id = insertRow(userId, item);
  refreshOutbox();
  void syncNow();
  return id;
}

export function save(item: NewOutboxItem): string {
  const user = useSession.getState().user;
  if (!user) throw new Error("Sign in again to save this.");
  return saveForUser(user.id, item);
}
