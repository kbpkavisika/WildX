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
  duration: string | null;
  canReplay: boolean;
  canEdit: boolean;
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

export interface WaypointView {
  id: number;
  position: LatLng;
  label: string;
}

export interface RouteRow {
  id: number;
  name: string;
  length: string;
  points: number;
}

export interface RangerPatrolCard {
  id: number;
  title: string;
  caption: string;
  status: { tone: ChipTone; label: string };
}

export interface RangerPatrolView {
  id: number;
  title: string;
  subtitle: string;
  status: { tone: ChipTone; label: string };
  route: LatLng[];
  track: LatLng[];
  waypoints: WaypointView[];
  facts: { label: string; value: string }[];
  canStart: boolean;
  isActive: boolean;
  completedAt: string | null;
}

export interface CoverageSectorView {
  id: number;
  name: string;
  rings: LatLng[][];
  neglected: boolean;
  caption: string;
  status: { tone: PatrolStatusTone; label: string };
}

export interface CoverageView {
  sectors: CoverageSectorView[];
  neglectedCount: number;
}

export interface CoverageReportRow {
  id: number;
  sector: string;
  points: number;
  patrols: number;
  unvisited: boolean;
  lastVisit: string;
}

export interface CoverageReportView {
  rows: CoverageReportRow[];
  visitedCount: number;
  sectorCount: number;
}

export interface ReplayView {
  title: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  track: LatLng[];
  walked: LatLng[];
  position: LatLng | null;
  scrubTime: string;
  endTime: string;
  maxIndex: number;
  waypoints: WaypointView[];
}
