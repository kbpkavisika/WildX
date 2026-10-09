import type { DispatchResponse } from "@/lib/api/dispatches";
import type { IncidentResponse } from "@/lib/api/incidents";
import { GOOGLE_MAPS_URL } from "@/lib/constants";
import { DISPATCH_STATUSES, SOURCE_TYPES, type DispatchStatus, type SourceType } from "@/lib/enums";
import { formatDayTime } from "@/lib/format";
import type { ChipView, DetailFact, TaskRow } from "@/lib/view-types";

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

export interface DispatchView {
  id: number;
  title: string;
  status: ChipView;
  facts: DetailFact[];
  canAcknowledge: boolean;
  canComplete: boolean;
  canDecline: boolean;
}

function sourceTitle(dispatch: DispatchResponse): string {
  const code = dispatch.sourceType === SOURCE_TYPES.INCIDENT ? `INC-${dispatch.sourceId}` : `#${dispatch.sourceId}`;
  return `${SOURCE_LABELS[dispatch.sourceType]} ${code}`;
}

export function toDispatchRows(dispatches: DispatchResponse[], now: Date): TaskRow[] {
  const open = (dispatch: DispatchResponse) => Number(OPEN_STATUSES.has(dispatch.status));
  return [...dispatches]
    .sort((a, b) => open(b) - open(a) || b.assignedAt.localeCompare(a.assignedAt))
    .map((dispatch) => ({
      key: `d${dispatch.id}`,
      dispatchId: dispatch.id,
      mapsUrl: dispatch.lat !== null && dispatch.lng !== null ? `${GOOGLE_MAPS_URL}${dispatch.lat},${dispatch.lng}` : null,
      title: sourceTitle(dispatch),
      caption: `Assigned ${formatDayTime(new Date(dispatch.assignedAt), now)}`,
      status: DISPATCH_STATUS_DISPLAY[dispatch.status],
    }));
}

function dispatchFacts(dispatch: DispatchResponse, now: Date): DetailFact[] {
  return [
    { label: "Assigned", value: `${formatDayTime(new Date(dispatch.assignedAt), now)}${dispatch.assignedByName ? ` by ${dispatch.assignedByName}` : ""}` },
    ...(dispatch.note ? [{ label: dispatch.status === DISPATCH_STATUSES.DECLINED ? "Decline reason" : "Note", value: dispatch.note }] : []),
    ...(dispatch.outcome ? [{ label: "Outcome", value: dispatch.outcome }] : []),
  ];
}

export function toDispatchView(dispatch: DispatchResponse, incident: IncidentResponse | undefined, now: Date): DispatchView {
  return {
    id: dispatch.id,
    title: incident ? `${incident.typeName} · INC-${incident.id}` : sourceTitle(dispatch),
    status: DISPATCH_STATUS_DISPLAY[dispatch.status],
    facts: dispatchFacts(dispatch, now),
    canAcknowledge: dispatch.status === DISPATCH_STATUSES.ASSIGNED,
    canComplete: dispatch.status === DISPATCH_STATUSES.ACKNOWLEDGED,
    canDecline: OPEN_STATUSES.has(dispatch.status),
  };
}
