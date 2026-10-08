import type { DispatchResponse, ResponderResponse } from "@/lib/api/dispatches";
import type { IncidentResponse } from "@/lib/api/incidents";
import { DISPATCH_STATUSES, SOURCE_TYPES, type DispatchStatus, type SourceType } from "@/lib/enums";
import { formatAgo, formatDayTime, formatKm, initialsOf } from "@/lib/format";
import { INCIDENT_STATUS_DISPLAY } from "@/lib/incidents/mappers";
import type { ChipView, DetailFact } from "@/lib/incidents/types";
import type { DispatchView, ResponderOption, TaskRow } from "./types";

const NO_DISTANCE = "Distance unknown";

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

function presence(responder: ResponderResponse, now: Date): ResponderOption["presence"] {
  const seen = responder.lastSeenAt ? ` · seen ${formatAgo(new Date(responder.lastSeenAt), now)}` : "";
  return responder.offline
    ? { tone: "negative", label: `Offline${seen}` }
    : { tone: "positive", label: `On patrol${seen}` };
}

export function toResponderOptions(responders: ResponderResponse[], now: Date): ResponderOption[] {
  return responders.map((responder) => ({
    id: responder.id,
    name: responder.name,
    initials: initialsOf(responder.name),
    distance: responder.distanceM === null ? NO_DISTANCE : `${formatKm(responder.distanceM)} away`,
    presence: presence(responder, now),
  }));
}

function whenLabel(value: string, now: Date): string {
  return formatDayTime(new Date(value), now);
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
      id: dispatch.id,
      href: `/ranger/dispatch/${dispatch.id}`,
      title: sourceTitle(dispatch),
      caption: `Assigned ${whenLabel(dispatch.assignedAt, now)}`,
      status: DISPATCH_STATUS_DISPLAY[dispatch.status],
    }));
}

export function toMyIncidentRows(incidents: IncidentResponse[], now: Date): TaskRow[] {
  return incidents.map((incident) => ({
    id: incident.id,
    href: null,
    title: `${incident.typeName} · INC-${incident.id}`,
    caption: `${incident.sectorName ?? "Outside sectors"} · ${whenLabel(incident.occurredAt, now)}`,
    status: INCIDENT_STATUS_DISPLAY[incident.status],
  }));
}

function dispatchFacts(dispatch: DispatchResponse, now: Date): DetailFact[] {
  return [
    { label: "Assigned", value: `${whenLabel(dispatch.assignedAt, now)}${dispatch.assignedByName ? ` by ${dispatch.assignedByName}` : ""}` },
    ...(dispatch.note ? [{ label: dispatch.status === DISPATCH_STATUSES.DECLINED ? "Decline reason" : "Note", value: dispatch.note }] : []),
    ...(dispatch.outcome ? [{ label: "Outcome", value: dispatch.outcome }] : []),
  ];
}

export function toDispatchView(dispatch: DispatchResponse, incident: IncidentResponse | undefined, now: Date): DispatchView {
  const title = incident ? `${incident.typeName} · INC-${incident.id}` : sourceTitle(dispatch);
  return {
    id: dispatch.id,
    title,
    incidentId: dispatch.sourceType === SOURCE_TYPES.INCIDENT ? dispatch.sourceId : null,
    status: DISPATCH_STATUS_DISPLAY[dispatch.status],
    facts: dispatchFacts(dispatch, now),
    canAcknowledge: dispatch.status === DISPATCH_STATUSES.ASSIGNED,
    canComplete: dispatch.status === DISPATCH_STATUSES.ACKNOWLEDGED,
    canDecline: OPEN_STATUSES.has(dispatch.status),
  };
}
