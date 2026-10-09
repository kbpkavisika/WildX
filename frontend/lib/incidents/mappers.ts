import type { IncidentTypeResponse } from "@/lib/api/incident-types";
import type { IncidentResponse } from "@/lib/api/incidents";
import {
  INCIDENT_STATUSES,
  LOCATION_SOURCES,
  SEVERITIES,
  type IncidentStatus,
  type LocationSource,
  type Severity,
} from "@/lib/enums";
import { COORDINATE_DECIMALS } from "@/lib/constants";
import { formatDayTime, formatLatLng } from "@/lib/format";
import type { LatLng } from "@/lib/patrols/types";
import {
  ALL,
  type ChipView,
  type DetailFact,
  type IncidentDetailView,
  type IncidentQueueFilters,
  type IncidentQueueView,
  type IncidentRow,
  type IncidentTypeRow,
  type IncidentTypesView,
  type StatusFilterOption,
} from "./types";

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

const ACTIVE_DISPLAY: ChipView = { tone: "positive", label: "Active" };
const INACTIVE_DISPLAY: ChipView = { tone: "neutral", label: "Inactive" };

function toIncidentTypeRow(type: IncidentTypeResponse): IncidentTypeRow {
  return {
    id: type.id,
    name: type.name,
    severity: SEVERITY_DISPLAY[type.defaultSeverity],
    status: type.active ? ACTIVE_DISPLAY : INACTIVE_DISPLAY,
  };
}

export function toActiveTypeOptions(types: IncidentTypeResponse[]): IncidentTypeResponse[] {
  return types.filter((type) => type.active).sort((a, b) => a.name.localeCompare(b.name));
}

export function toIncidentTypesView(types: IncidentTypeResponse[]): IncidentTypesView {
  const sorted = [...types].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  const activeCount = types.filter((type) => type.active).length;
  return { rows: sorted.map(toIncidentTypeRow), activeCount, inactiveCount: types.length - activeCount };
}

export function toTypeFilter(value: string): IncidentQueueFilters["typeId"] {
  return value === ALL ? ALL : Number(value);
}

export function toSeverityFilter(value: string): IncidentQueueFilters["severity"] {
  return Object.values(SEVERITIES).find((severity) => severity === value) ?? ALL;
}

function toIncidentRow(incident: IncidentResponse, now: Date): IncidentRow {
  return {
    id: incident.id,
    title: incident.typeName,
    code: `INC-${incident.id}`,
    sector: incident.sectorName ?? NO_SECTOR,
    reporter: incident.reporterName,
    reported: formatDayTime(new Date(incident.occurredAt), now),
    severity: SEVERITY_DISPLAY[incident.severity],
    status: INCIDENT_STATUS_DISPLAY[incident.status],
    statusNote: statusNote(incident),
  };
}

function statusNote(incident: IncidentResponse): string | null {
  if (incident.status === INCIDENT_STATUSES.ASSIGNED) return incident.responderName && `To ${incident.responderName}`;
  if (incident.status === INCIDENT_STATUSES.NEW) return null;
  return incident.resolutionNote;
}

function matchesTypeAndSeverity(incident: IncidentResponse, filters: IncidentQueueFilters): boolean {
  return (filters.typeId === ALL || incident.typeId === filters.typeId)
    && (filters.severity === ALL || incident.severity === filters.severity);
}

function statusOptions(incidents: IncidentResponse[]): StatusFilterOption[] {
  const all: StatusFilterOption = { value: ALL, label: "All", count: incidents.length };
  return [
    all,
    ...Object.values(INCIDENT_STATUSES).map((status) => ({
      value: status,
      label: INCIDENT_STATUS_DISPLAY[status].label,
      count: incidents.filter((incident) => incident.status === status).length,
    })),
  ];
}

const NO_VALUE = "—";

const LOCATION_SOURCE_LABELS: Record<LocationSource, string> = {
  [LOCATION_SOURCES.GPS]: "GPS",
  [LOCATION_SOURCES.MANUAL]: "Tapped on map",
};

const CLOSED_STATUSES = new Set<IncidentStatus>([INCIDENT_STATUSES.RESOLVED, INCIDENT_STATUSES.DISMISSED]);

function closingFact(incident: IncidentResponse): DetailFact[] {
  if (!incident.resolutionNote) return [];
  const label = incident.status === INCIDENT_STATUSES.DISMISSED ? "Dismissal reason" : "Outcome";
  return [{ label, value: incident.resolutionNote }];
}

export function toIncidentDetailView(incident: IncidentResponse, now: Date): IncidentDetailView {
  const position: LatLng | null = incident.lat !== null && incident.lng !== null ? [incident.lat, incident.lng] : null;
  return {
    id: incident.id,
    title: incident.typeName,
    subtitle: `INC-${incident.id} · reported by ${incident.reporterName} · ${formatDayTime(new Date(incident.occurredAt), now)}`,
    status: INCIDENT_STATUS_DISPLAY[incident.status],
    severity: incident.severity,
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
    canChangeSeverity: !CLOSED_STATUSES.has(incident.status),
    canDispatchOrDismiss: incident.status === INCIDENT_STATUSES.NEW,
  };
}

export function toIncidentQueueView(incidents: IncidentResponse[], filters: IncidentQueueFilters, now: Date): IncidentQueueView {
  const narrowed = incidents.filter((incident) => matchesTypeAndSeverity(incident, filters));
  const shown = filters.status === ALL ? narrowed : narrowed.filter((incident) => incident.status === filters.status);
  return {
    rows: shown.map((incident) => toIncidentRow(incident, now)),
    statusOptions: statusOptions(narrowed),
    newCount: incidents.filter((incident) => incident.status === INCIDENT_STATUSES.NEW).length,
  };
}
