import { z } from "zod";
import { ZONE_TYPES } from "@/lib/enums";
import { apiGet } from "./client";

const zoneSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  name: z.string(),
  type: z.enum(ZONE_TYPES),
  polygonGeojson: z.string(),
});

export type ZoneResponse = z.infer<typeof zoneSchema>;

export function fetchZones(parkId: number): Promise<ZoneResponse[]> {
  return apiGet(`/parks/${parkId}/zones`, z.array(zoneSchema));
}
