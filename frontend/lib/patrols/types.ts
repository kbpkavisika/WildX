import type { ChipTone } from "@/lib/dashboard/types";

export type LatLng = [number, number];

export type PatrolStatusTone = "positive" | "negative";

export interface LivePatrolView {
  id: number;
  number: number;
  colorIndex: number;
  title: string;
  caption: string;
  status: { tone: PatrolStatusTone; label: string };
  offline: boolean;
  position: LatLng | null;
  track: LatLng[];
}

export interface SectorShape {
  id: number;
  name: string;
  rings: LatLng[][];
}

export interface IncidentMarker {
  id: number;
  label: string;
  position: LatLng;
}

export interface ActivePatrolsView {
  patrols: LivePatrolView[];
  sectors: SectorShape[];
  incidents: IncidentMarker[];
  lastUpdate: string | null;
}

export const PATROL_FILTERS = {
  ALL: "ALL",
  ACTIVE: "ACTIVE",
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
} as const;
export type PatrolFilter = (typeof PATROL_FILTERS)[keyof typeof PATROL_FILTERS];

export interface PatrolRow {
  id: number;
  title: string;
  code: string;
  leaderName: string;
  leaderInitials: string;
  day: string;
  time: string | null;
  distance: string;
  status: { tone: ChipTone; label: string };
  filter: PatrolFilter | null;
}

export interface PatrolFilterOption {
  value: PatrolFilter;
  label: string;
  count: number;
}

export interface PatrolTableView {
  rows: PatrolRow[];
  filters: PatrolFilterOption[];
  scheduledCount: number;
  activeCount: number;
}
