import type { IncidentResponse, IncidentTypeResponse } from "@/lib/api/incidents";
import { COORDINATE_DECIMALS } from "@/lib/constants";
import { INCIDENT_STATUSES, LOCATION_SOURCES, SEVERITIES, type IncidentStatus, type LocationSource, type Severity } from "@/lib/enums";
import { formatDayTime, formatLatLng } from "@/lib/format";
import type { LatLng } from "@/lib/geo";
import { pendingCaption, pendingOfKind } from "@/lib/outbox/overlay";
import { OUTBOX_KINDS, type OutboxRow } from "@/lib/outbox/types";
import { NO_VALUE, PENDING_CHIP, type ChipView, type DetailFact, type TaskRow } from "@/lib/view-types";

const NO_SECTOR = "Outside sectors";

export const SEVERITY_DISPLAY: Record<Severity, ChipView> = {
  [SEVERITIES.LOW]: { tone: "neutral", label: "Low" },
  [SEVERITIES.MEDIUM]: { tone: "neutral", label: "Medium" },
  [SEVERITIES.HIGH]: { tone: "negative", label: "High" },
  [SEVERITIES.CRITICAL]: { tone: "negative", label: "Critical" },
};

export const INCIDENT_STATUS_DISPLAY: Record<IncidentStatus, ChipView> = {
  [INCIDENT_STATUSES.NEW]: { tone: "negative", label: "New" },
  [INCIDENT_STATUSES.ASSIGNED]: { tone: "positive", label: "Assigned" },
  [INCIDENT_STATUSES.RESOLVED]: { tone: "done", label: "Resolved" },
  [INCIDENT_STATUSES.DISMISSED]: { tone: "neutral", label: "Dismissed" },
};

const LOCATION_SOURCE_LABELS: Record<LocationSource, string> = {
  [LOCATION_SOURCES.GPS]: "GPS",
  [LOCATION_SOURCES.MANUAL]: "Tapped on map",
};

export interface IncidentDetailView {
  position: LatLng | null;
  facts: DetailFact[];
  hasPhoto: boolean;
}

export function toActiveTypeOptions(types: IncidentTypeResponse[]): IncidentTypeResponse[] {
  return types.filter((type) => type.active).sort((a, b) => a.name.localeCompare(b.name));
}

export function toMyIncidentRows(incidents: IncidentResponse[], rows: OutboxRow[], now: Date): TaskRow[] {
  const pending = pendingOfKind(rows, OUTBOX_KINDS.INCIDENT).map((row) => ({
    key: row.id,
    dispatchId: null,
    title: row.label,
    caption: pendingCaption(row),
    status: PENDING_CHIP,
  }));
  const saved = incidents.map((incident) => ({
    key: `s${incident.id}`,
    dispatchId: null,
    title: `${incident.typeName} · INC-${incident.id}`,
    caption: `${incident.sectorName ?? NO_SECTOR} · ${formatDayTime(new Date(incident.occurredAt), now)}`,
    status: INCIDENT_STATUS_DISPLAY[incident.status],
  }));
  return [...pending.reverse(), ...saved];
}

function closingFact(incident: IncidentResponse): DetailFact[] {
  if (!incident.resolutionNote) return [];
  const label = incident.status === INCIDENT_STATUSES.DISMISSED ? "Dismissal reason" : "Outcome";
  return [{ label, value: incident.resolutionNote }];
}

export function toIncidentDetailView(incident: IncidentResponse): IncidentDetailView {
  const position: LatLng | null = incident.lat !== null && incident.lng !== null ? [incident.lat, incident.lng] : null;
  return {
    position,
    facts: [
      { label: "Sector", value: incident.sectorName ?? NO_SECTOR },
      { label: "Location", value: LOCATION_SOURCE_LABELS[incident.locationSource] },
      { label: "Coordinates", value: position ? formatLatLng(position, COORDINATE_DECIMALS) : NO_VALUE },
      { label: "Patrol", value: incident.patrolId === null ? NO_VALUE : `PT-${incident.patrolId}` },
      { label: "Description", value: incident.description ?? NO_VALUE },
      ...closingFact(incident),
    ],
    hasPhoto: incident.photoPath !== null,
  };
}
