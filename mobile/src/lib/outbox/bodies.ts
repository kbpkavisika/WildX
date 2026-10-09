import { z } from "zod";
import { DISPOSITIONS, LOCATION_SOURCES, WAYPOINT_TYPES } from "@/lib/enums";
import type { OutboxRow } from "./types";

export const atBody = z.object({ at: z.string() });

export const pointBody = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracyM: z.number().nullable(),
  recordedAt: z.string(),
  isWaypoint: z.boolean().optional(),
  note: z.string().nullable().optional(),
  waypointType: z.enum(WAYPOINT_TYPES).nullable().optional(),
});

export const incidentBody = z.object({
  clientId: z.string(),
  typeId: z.number(),
  lat: z.number(),
  lng: z.number(),
  locationSource: z.enum(LOCATION_SOURCES),
  description: z.string().nullable(),
  occurredAt: z.string(),
});

export const completeBody = z.object({ outcome: z.string() });

export const declineBody = z.object({ reason: z.string().nullable() });

export const resolveBody = z.object({ disposition: z.enum(DISPOSITIONS) });

export function bodyOf<T extends z.ZodType>(row: OutboxRow, schema: T): z.infer<T> {
  return schema.parse(JSON.parse(row.body));
}
