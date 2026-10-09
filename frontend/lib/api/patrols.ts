import { z } from "zod";
import { PATROL_STATUSES, ROLES, WAYPOINT_TYPES, type WaypointType } from "@/lib/enums";
import { apiGet, apiGetBlob, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const trackPointSchema = z.object({
  id: z.number(),
  lat: z.number(),
  lng: z.number(),
  recordedAt: timestamp,
  isWaypoint: z.boolean(),
  note: z.string().nullable(),
  waypointType: z.enum(WAYPOINT_TYPES).nullable(),
  sectorId: z.number().nullable(),
});

const routeSchema = z.object({ id: z.number(), name: z.string(), pathGeojson: z.string() });

const patrolSchema = z.object({
  id: z.number(),
  route: routeSchema,
  rangerId: z.number(),
  rangerName: z.string(),
  scheduledDate: z.iso.date(),
  status: z.enum(PATROL_STATUSES),
  startedAt: timestamp.nullable(),
  endedAt: timestamp.nullable(),
  gpsAvailable: z.boolean(),
});

const livePatrolSchema = z.object({
  patrol: patrolSchema,
  lastPosition: trackPointSchema.nullable(),
  lastSeenAt: timestamp.nullable(),
  offline: z.boolean(),
});

const patrolHistorySchema = z.object({
  patrol: z.object({ id: z.number() }),
  distanceM: z.number(),
  durationSeconds: z.number(),
});

const rangerSchema = z.object({ id: z.number(), name: z.string(), role: z.literal(ROLES.RANGER) });

const sectorCoverageSchema = z.object({
  sectorId: z.number(),
  sectorName: z.string(),
  polygonGeojson: z.string(),
  lastPatrolledAt: timestamp.nullable(),
  daysSinceLastPatrol: z.number().nullable(),
  neglected: z.boolean(),
});

const coverageReportRowSchema = z.object({
  sectorId: z.number(),
  sectorName: z.string(),
  pointCount: z.number(),
  patrolCount: z.number(),
  lastPatrolledAt: timestamp.nullable(),
});

export type TrackPointResponse = z.infer<typeof trackPointSchema>;
export type PatrolResponse = z.infer<typeof patrolSchema>;
export type LivePatrolResponse = z.infer<typeof livePatrolSchema>;
export type PatrolHistoryResponse = z.infer<typeof patrolHistorySchema>;
export type RouteResponse = z.infer<typeof routeSchema>;
export type RangerOption = z.infer<typeof rangerSchema>;
export type SectorCoverageResponse = z.infer<typeof sectorCoverageSchema>;
export type CoverageReportRowResponse = z.infer<typeof coverageReportRowSchema>;

export interface AssignPatrolRequest {
  routeId: number;
  rangerId: number;
  scheduledDate: string;
}

export interface RouteRequest {
  name: string;
  pathGeojson: string;
}

export interface TrackPointRequest {
  lat: number;
  lng: number;
  accuracyM: number | null;
  recordedAt: string;
  isWaypoint?: boolean;
  note?: string | null;
  waypointType?: WaypointType | null;
}

export function fetchLivePatrols(): Promise<LivePatrolResponse[]> {
  return apiGet("/monitor/live", z.array(livePatrolSchema));
}

export function fetchTrack(patrolId: number): Promise<TrackPointResponse[]> {
  return apiGet(`/patrols/${patrolId}/track`, z.array(trackPointSchema));
}

export function fetchPatrols(): Promise<PatrolResponse[]> {
  return apiGet("/patrols", z.array(patrolSchema));
}

export function fetchPatrolHistory(): Promise<PatrolHistoryResponse[]> {
  return apiGet("/patrols/history", z.array(patrolHistorySchema));
}

export function fetchRoutes(): Promise<RouteResponse[]> {
  return apiGet("/routes", z.array(routeSchema));
}

export function createRoute(request: RouteRequest): Promise<RouteResponse> {
  return apiPost("/routes", request, routeSchema);
}

export function fetchRangers(): Promise<RangerOption[]> {
  return apiGet("/rangers", z.array(rangerSchema));
}

export function assignPatrol(request: AssignPatrolRequest): Promise<PatrolResponse> {
  return apiPost("/patrols", request, patrolSchema);
}

export function fetchMyPatrols(): Promise<PatrolResponse[]> {
  return apiGet("/me/patrols", z.array(patrolSchema));
}

export function startPatrol(patrolId: number, at: string): Promise<PatrolResponse> {
  return apiPost(`/patrols/${patrolId}/start`, { at }, patrolSchema);
}

export function endPatrol(patrolId: number, at: string): Promise<PatrolResponse> {
  return apiPost(`/patrols/${patrolId}/end`, { at }, patrolSchema);
}

export function reportGps(patrolId: number, available: boolean): Promise<PatrolResponse> {
  return apiPost(`/patrols/${patrolId}/gps`, { available }, patrolSchema);
}

export function recordPoints(patrolId: number, points: TrackPointRequest[]): Promise<TrackPointResponse[]> {
  return apiPost(`/patrols/${patrolId}/points`, points, z.array(trackPointSchema));
}

export function fetchCoverage(): Promise<SectorCoverageResponse[]> {
  return apiGet("/monitor/coverage", z.array(sectorCoverageSchema));
}

function coverageReportPath(from: string, to: string): string {
  return `/reports/coverage?from=${from}&to=${to}`;
}

export function fetchCoverageReport(from: string, to: string): Promise<CoverageReportRowResponse[]> {
  return apiGet(coverageReportPath(from, to), z.array(coverageReportRowSchema));
}

export function fetchCoverageReportCsv(from: string, to: string): Promise<Blob> {
  return apiGetBlob(`${coverageReportPath(from, to)}&format=csv`);
}
