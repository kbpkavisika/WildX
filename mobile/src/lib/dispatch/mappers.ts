import type { DispatchResponse } from "@/lib/api/dispatches";
import type { IncidentResponse } from "@/lib/api/incidents";
import { DISPATCH_STATUSES, SOURCE_TYPES, type DispatchStatus, type SourceType } from "@/lib/enums";
import { formatDayTime } from "@/lib/format";
import { bodyOf, completeBody, declineBody } from "@/lib/outbox/bodies";
import { pendingFor } from "@/lib/outbox/overlay";
import { OUTBOX_KINDS, type OutboxRow } from "@/lib/outbox/types";
import { PENDING_CHIP, type ChipView, type DetailFact, type TaskRow } from "@/lib/view-types";

const DISPATCH_STATUS_DISPLAY: Record<DispatchStatus, ChipView> = {
  [DISPATCH_STATUSES.ASSIGNED]: { tone: "negative", label: "New task" },
  [DISPATCH_STATUSES.ACKNOWLEDGED]: { tone: "positive", label: "On the way" },
  [DISPATCH_STATUSES.COMPLETED]: { tone: "done", label: "Completed" },
  [DISPATCH_STATUSES.DECLINED]: { tone: "neutral", label: "Declined" },
};

const SOURCE_LABELS: Record<SourceType, string> = {
  [SOURCE_TYPES.INCIDENT]: "Incident",
  [SOURCE_TYPES.ALERT]: "Alert",
  [SOURCE_TYPES.COMMUNITY_REPORT]: "Community report",
};

const OPEN_STATUSES = new Set<DispatchStatus>([DISPATCH_STATUSES.ASSIGNED, DISPATCH_STATUSES.ACKNOWLEDGED]);

export interface LocalDispatch {
  dispatch: DispatchResponse;
  pending: boolean;
}

export interface DispatchView {
  id: number;
  title: string;
  status: ChipView;
  facts: DetailFact[];
  canAcknowledge: boolean;
  canComplete: boolean;
  canDecline: boolean;
}

export function withPendingDispatchChanges(dispatch: DispatchResponse, rows: OutboxRow[]): LocalDispatch {
  const declined = pendingFor(rows, OUTBOX_KINDS.DISPATCH_DECLINE, dispatch.id);
  if (declined) return { pending: true, dispatch: { ...dispatch, status: DISPATCH_STATUSES.DECLINED, note: bodyOf(declined, declineBody).reason } };
  const completed = pendingFor(rows, OUTBOX_KINDS.DISPATCH_COMPLETE, dispatch.id);
  if (completed) {
    return {
      pending: true,
      dispatch: { ...dispatch, status: DISPATCH_STATUSES.COMPLETED, outcome: bodyOf(completed, completeBody).outcome, completedAt: new Date(completed.createdAt).toISOString() },
    };
  }
  const acknowledged = pendingFor(rows, OUTBOX_KINDS.DISPATCH_ACK, dispatch.id);
  if (acknowledged) {
    return { pending: true, dispatch: { ...dispatch, status: DISPATCH_STATUSES.ACKNOWLEDGED, acknowledgedAt: new Date(acknowledged.createdAt).toISOString() } };
  }
  return { pending: false, dispatch };
}

function sourceTitle(dispatch: DispatchResponse): string {
  const code = dispatch.sourceType === SOURCE_TYPES.INCIDENT ? `INC-${dispatch.sourceId}` : `#${dispatch.sourceId}`;
  return `${SOURCE_LABELS[dispatch.sourceType]} ${code}`;
}

function statusOf({ dispatch, pending }: LocalDispatch): ChipView {
  return pending ? PENDING_CHIP : DISPATCH_STATUS_DISPLAY[dispatch.status];
}

export function toDispatchRows(dispatches: LocalDispatch[], now: Date): TaskRow[] {
  const open = ({ dispatch }: LocalDispatch) => Number(OPEN_STATUSES.has(dispatch.status));
  return [...dispatches]
    .sort((a, b) => open(b) - open(a) || b.dispatch.assignedAt.localeCompare(a.dispatch.assignedAt))
    .map((local) => ({
      key: `d${local.dispatch.id}`,
      dispatchId: local.dispatch.id,
      title: sourceTitle(local.dispatch),
      caption: `Assigned ${formatDayTime(new Date(local.dispatch.assignedAt), now)}`,
      status: statusOf(local),
    }));
}

function dispatchFacts(dispatch: DispatchResponse, now: Date): DetailFact[] {
  return [
    { label: "Assigned", value: `${formatDayTime(new Date(dispatch.assignedAt), now)}${dispatch.assignedByName ? ` by ${dispatch.assignedByName}` : ""}` },
    ...(dispatch.note ? [{ label: dispatch.status === DISPATCH_STATUSES.DECLINED ? "Decline reason" : "Note", value: dispatch.note }] : []),
    ...(dispatch.outcome ? [{ label: "Outcome", value: dispatch.outcome }] : []),
  ];
}

export function toDispatchView(local: LocalDispatch, incident: IncidentResponse | undefined, now: Date): DispatchView {
  const { dispatch } = local;
  return {
    id: dispatch.id,
    title: incident ? `${incident.typeName} · INC-${incident.id}` : sourceTitle(dispatch),
    status: statusOf(local),
    facts: dispatchFacts(dispatch, now),
    canAcknowledge: dispatch.status === DISPATCH_STATUSES.ASSIGNED,
    canComplete: dispatch.status === DISPATCH_STATUSES.ACKNOWLEDGED,
    canDecline: OPEN_STATUSES.has(dispatch.status),
  };
}
