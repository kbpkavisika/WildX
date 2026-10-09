import Storage from "expo-sqlite/kv-store";
import { create } from "zustand";
import { useSession } from "@/lib/auth/store";
import { rowsOf } from "./repository";
import type { OutboxRow } from "./types";

const LAST_SYNC_KEY = "wildx-last-sync";

interface OutboxState {
  rows: OutboxRow[];
  syncing: boolean;
  lastSyncAt: number | null;
}

function storedLastSync(): number | null {
  const value = Storage.getItemSync(LAST_SYNC_KEY);
  return value === null ? null : Number(value);
}

export const useOutbox = create<OutboxState>()(() => ({
  rows: [],
  syncing: false,
  lastSyncAt: storedLastSync(),
}));

export function refreshOutbox(): void {
  const user = useSession.getState().user;
  useOutbox.setState({ rows: user ? rowsOf(user.id) : [] });
}

export function markSynced(): void {
  const now = Date.now();
  Storage.setItemSync(LAST_SYNC_KEY, String(now));
  useOutbox.setState({ lastSyncAt: now });
}

interface ConnectionState {
  online: boolean;
}

export const useConnection = create<ConnectionState>()(() => ({ online: true }));
