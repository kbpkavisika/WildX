import { z } from "zod";
import type { TrackPointRequest } from "@/lib/api/patrols";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import { WAYPOINT_TYPES } from "@/lib/enums";
import { toPointRequest, type GpsFix } from "./tracking";

export const waypointFormSchema = z.object({
  waypointType: z.union([z.enum(WAYPOINT_TYPES), z.literal("")]),
  note: z.string().trim().max(WAYPOINT_NOTE_MAX, `Keep it under ${WAYPOINT_NOTE_MAX} characters`),
});

export type WaypointFormValues = z.infer<typeof waypointFormSchema>;

export const EMPTY_WAYPOINT: WaypointFormValues = { waypointType: "", note: "" };

export function toWaypointRequest(values: WaypointFormValues, fix: GpsFix, now: number): TrackPointRequest {
  return {
    ...toPointRequest({ ...fix, at: now }),
    isWaypoint: true,
    note: values.note === "" ? null : values.note,
    waypointType: values.waypointType === "" ? null : values.waypointType,
  };
}
