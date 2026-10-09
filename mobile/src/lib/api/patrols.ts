import { z } from "zod";
import { PATROL_STATUSES, WAYPOINT_TYPES, type WaypointType } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const trackPointSchema = z.object({
  id: z.number(),
  lat: z.number(),
  lng: z.number(),
  recordedAt: timestamp,
  isWaypoint: z.boolean(),
  note: z.string().nullable(),
  waypointType: z.enum(WAYPOINT_TYPES).nullable(),
});

const patrolSchema = z.object({
  id: z.number(),
  route: z.object({ id: z.number(), name: z.string(), pathGeojson: z.string() }),
  rangerName: z.string(),
  scheduledDate: z.iso.date(),
  status: z.enum(PATROL_STATUSES),
  startedAt: timestamp.nullable(),
  endedAt: timestamp.nullable(),
});

export type TrackPointResponse = z.infer<typeof trackPointSchema>;
export type PatrolResponse = z.infer<typeof patrolSchema>;

export interface TrackPointRequest {
  lat: number;
  lng: number;
  accuracyM: number | null;
  recordedAt: string;
  isWaypoint?: boolean;
  note?: string | null;
  waypointType?: WaypointType | null;
}

export function fetchMyPatrols(): Promise<PatrolResponse[]> {
  return apiGet("/me/patrols", z.array(patrolSchema));
}

export function fetchTrack(patrolId: number): Promise<TrackPointResponse[]> {
  return apiGet(`/patrols/${patrolId}/track`, z.array(trackPointSchema));
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
