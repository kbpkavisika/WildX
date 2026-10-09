import { formatTime } from "@/lib/format";
import { OUTBOX_KINDS, OUTBOX_STATUSES, type OutboxKind, type OutboxRow } from "./types";

const KIND_TITLES: Record<OutboxKind, string> = {
  [OUTBOX_KINDS.PATROL_START]: "Patrol start",
  [OUTBOX_KINDS.PATROL_END]: "Patrol end",
  [OUTBOX_KINDS.TRACK_POINT]: "Track points",
  [OUTBOX_KINDS.INCIDENT]: "Incident report",
  [OUTBOX_KINDS.DISPATCH_ACK]: "Dispatch acknowledgement",
  [OUTBOX_KINDS.DISPATCH_COMPLETE]: "Dispatch completion",
  [OUTBOX_KINDS.DISPATCH_DECLINE]: "Dispatch decline",
  [OUTBOX_KINDS.ALERT_ACK]: "Alert acknowledgement",
  [OUTBOX_KINDS.ALERT_RESOLVE]: "Alert resolution",
};

function titleOf(row: OutboxRow, count: number): string {
  const title = row.label ? `${KIND_TITLES[row.kind]} · ${row.label}` : KIND_TITLES[row.kind];
  return count > 1 ? `${title} (${count})` : title;
}

const OFFLINE_SUFFIX = "It will sync when you are online.";

export function savedNotice(action: string, online: boolean): string {
  return online ? `${action}.` : `${action}. ${OFFLINE_SUFFIX}`;
}

export interface RejectedGroup {
  key: string;
  title: string;
  error: string;
  rows: OutboxRow[];
}

export function pendingOfKind(rows: OutboxRow[], kind: OutboxKind): OutboxRow[] {
  return rows.filter((row) => row.status === OUTBOX_STATUSES.PENDING && row.kind === kind);
}

export function pendingFor(rows: OutboxRow[], kind: OutboxKind, targetId: number): OutboxRow | undefined {
  return pendingOfKind(rows, kind).find((row) => row.targetId === targetId);
}

export function pendingCaption(row: OutboxRow): string {
  return `Saved ${formatTime(new Date(row.createdAt))} · waiting to sync`;
}

export function pendingCount(rows: OutboxRow[]): number {
  return rows.filter((row) => row.status === OUTBOX_STATUSES.PENDING).length;
}

export function rejectedGroups(rows: OutboxRow[]): RejectedGroup[] {
  const groups = new Map<string, RejectedGroup>();
  rows
    .filter((row) => row.status === OUTBOX_STATUSES.REJECTED)
    .forEach((row) => {
      const key = `${row.kind}|${row.label}|${row.error ?? ""}`;
      const group = groups.get(key) ?? { key, title: "", error: row.error ?? "", rows: [] };
      group.rows.push(row);
      groups.set(key, group);
    });
  return [...groups.values()].map((group) => ({ ...group, title: titleOf(group.rows[0], group.rows.length) }));
}
