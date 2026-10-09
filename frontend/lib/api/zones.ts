import { z } from "zod";
import { ZONE_TYPES, type ZoneType } from "@/lib/enums";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

const zoneSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  name: z.string(),
  type: z.enum(ZONE_TYPES),
  polygonGeojson: z.string(),
});

export type ZoneResponse = z.infer<typeof zoneSchema>;

export interface ZoneRequest {
  name: string;
  type: ZoneType;
  polygonGeojson: string;
}

export function fetchZones(parkId: number): Promise<ZoneResponse[]> {
  return apiGet(`/parks/${parkId}/zones`, z.array(zoneSchema));
}

export function createZone(parkId: number, request: ZoneRequest): Promise<ZoneResponse> {
  return apiPost(`/parks/${parkId}/zones`, request, zoneSchema);
}

export function updateZone(parkId: number, zoneId: number, request: ZoneRequest): Promise<ZoneResponse> {
  return apiPut(`/parks/${parkId}/zones/${zoneId}`, request, zoneSchema);
}

export function deleteZone(parkId: number, zoneId: number): Promise<void> {
  return apiDelete(`/parks/${parkId}/zones/${zoneId}`);
}
