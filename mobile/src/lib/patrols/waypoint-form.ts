import { z } from "zod";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import { WAYPOINT_TYPES } from "@/lib/enums";

export const waypointFormSchema = z.object({
  waypointType: z.union([z.enum(WAYPOINT_TYPES), z.literal("")]),
  note: z.string().trim().max(WAYPOINT_NOTE_MAX, `Keep it under ${WAYPOINT_NOTE_MAX} characters`),
});

export type WaypointFormValues = z.infer<typeof waypointFormSchema>;

export const EMPTY_WAYPOINT: WaypointFormValues = { waypointType: "", note: "" };
