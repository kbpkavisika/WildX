import type { ChipTone } from "@/lib/dashboard/types";
import type { IncidentStatus, Severity } from "@/lib/enums";
import type { LatLng } from "@/lib/patrols/types";

export interface ChipView {
  tone: ChipTone;
  label: string;
}

export interface IncidentTypeRow {
  id: number;
  name: string;
  severity: ChipView;
  status: ChipView;
}

export interface IncidentTypesView {
  rows: IncidentTypeRow[];
  activeCount: number;
  inactiveCount: number;
}

export const ALL = "ALL";

export type StatusFilter = IncidentStatus | typeof ALL;

export interface IncidentQueueFilters {
  status: StatusFilter;
  typeId: number | typeof ALL;
  severity: Severity | typeof ALL;
}

export interface IncidentRow {
  id: number;
  title: string;
  code: string;
  sector: string;
  reporter: string;
  reported: string;
  severity: ChipView;
  status: ChipView;
  statusNote: string | null;
}

export interface DetailFact {
  label: string;
  value: string;
}

export interface IncidentDetailView {
  id: number;
  title: string;
  subtitle: string;
  status: ChipView;
  severity: Severity;
  position: LatLng | null;
  facts: DetailFact[];
  hasPhoto: boolean;
  canChangeSeverity: boolean;
  canDispatchOrDismiss: boolean;
}

export interface StatusFilterOption {
  value: StatusFilter;
  label: string;
  count: number;
}

export interface IncidentQueueView {
  rows: IncidentRow[];
  statusOptions: StatusFilterOption[];
  newCount: number;
}
