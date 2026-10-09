import { z } from "zod";
import { PATROL_STATUSES, ROLES } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const trackPointSchema = z.object({
  id: z.number(),
  lat: z.number(),
  lng: z.number(),
  recordedAt: timestamp,
  sectorId: z.number().nullable(),
});

const routeSchema = z.object({ id: z.number(), name: z.string() });

const patrolSchema = z.object({
  id: z.number(),
  route: routeSchema,
  rangerId: z.number(),
  rangerName: z.string(),
  scheduledDate: z.iso.date(),
  status: z.enum(PATROL_STATUSES),
  startedAt: timestamp.nullable(),
  endedAt: timestamp.nullable(),
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
});

const rangerSchema = z.object({ id: z.number(), name: z.string(), role: z.literal(ROLES.RANGER) });

export type TrackPointResponse = z.infer<typeof trackPointSchema>;
export type PatrolResponse = z.infer<typeof patrolSchema>;
export type LivePatrolResponse = z.infer<typeof livePatrolSchema>;
export type PatrolHistoryResponse = z.infer<typeof patrolHistorySchema>;
export type RouteOption = z.infer<typeof routeSchema>;
export type RangerOption = z.infer<typeof rangerSchema>;

export interface AssignPatrolRequest {
  routeId: number;
  rangerId: number;
  scheduledDate: string;
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

export function fetchMyPatrols(): Promise<PatrolResponse[]> {
  return apiGet("/me/patrols", z.array(patrolSchema));
}

export function fetchPatrolHistory(): Promise<PatrolHistoryResponse[]> {
  return apiGet("/patrols/history", z.array(patrolHistorySchema));
}

export function fetchRoutes(): Promise<RouteOption[]> {
  return apiGet("/routes", z.array(routeSchema));
}

export function fetchRangers(): Promise<RangerOption[]> {
  return apiGet("/rangers", z.array(rangerSchema));
}

export function assignPatrol(request: AssignPatrolRequest): Promise<PatrolResponse> {
  return apiPost("/patrols", request, patrolSchema);
}
