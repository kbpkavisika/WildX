export const OUTBOX_KINDS = {
  PATROL_START: "PATROL_START",
  PATROL_END: "PATROL_END",
  TRACK_POINT: "TRACK_POINT",
  INCIDENT: "INCIDENT",
  DISPATCH_ACK: "DISPATCH_ACK",
  DISPATCH_COMPLETE: "DISPATCH_COMPLETE",
  DISPATCH_DECLINE: "DISPATCH_DECLINE",
  ALERT_ACK: "ALERT_ACK",
  ALERT_RESOLVE: "ALERT_RESOLVE",
} as const;
export type OutboxKind = (typeof OUTBOX_KINDS)[keyof typeof OUTBOX_KINDS];

export const OUTBOX_STATUSES = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
} as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[keyof typeof OUTBOX_STATUSES];

export interface OutboxRow {
  id: string;
  userId: number;
  kind: OutboxKind;
  patrolId: number | null;
  targetId: number | null;
  label: string;
  body: string;
  photoUri: string | null;
  createdAt: number;
  status: OutboxStatus;
  error: string | null;
}

export interface NewOutboxItem {
  id?: string;
  kind: OutboxKind;
  patrolId?: number;
  targetId?: number;
  label: string;
  body: unknown;
  photoUri?: string | null;
}
