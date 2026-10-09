import { z } from "zod";
import type { TrackPointRequest } from "@/lib/api/patrols";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import { WAYPOINT_TYPES } from "@/lib/enums";
import { toPointRequest, type GpsFix } from "./tracking";

export const waypointFormSchema = z.object({
  waypointType: z.union([z.enum(WAYPOINT_TYPES), z.literal("")]),
  note: z.string().trim().max(WAYPOINT_NOTE_MAX, `Keep it under ${WAYPOINT_NOTE_MAX} characters`),
  position: z.tuple([z.number(), z.number()]).nullable(),
});

export type WaypointFormValues = z.infer<typeof waypointFormSchema>;

export const EMPTY_WAYPOINT: WaypointFormValues = { waypointType: "", note: "", position: null };

export function toWaypointRequest(values: WaypointFormValues, fix: GpsFix | null, now: number): TrackPointRequest {
  const point = values.position ? { position: values.position, accuracyM: null } : fix;
  if (!point) throw new Error("Tap the map to choose the location.");
  return {
    ...toPointRequest({ ...point, at: now }),
    isWaypoint: true,
    note: values.note === "" ? null : values.note,
    waypointType: values.waypointType === "" ? null : values.waypointType,
  };
}
