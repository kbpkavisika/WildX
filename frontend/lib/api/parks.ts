import { z } from "zod";
import { sessionUserSchema } from "./auth";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

const sectorSchema = z.object({
  id: z.number(),
  name: z.string(),
  polygonGeojson: z.string(),
});

export type SectorResponse = z.infer<typeof sectorSchema>;

export interface SectorRequest {
  name: string;
  polygonGeojson: string;
}

const parkSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  neglectDays: z.number(),
});

export type ParkResponse = z.infer<typeof parkSchema>;

export interface ParkRequest {
  name: string;
  code: string;
}

export function fetchParks(): Promise<ParkResponse[]> {
  return apiGet("/parks", z.array(parkSchema));
}

export function createPark(request: ParkRequest): Promise<ParkResponse> {
  return apiPost("/parks", request, parkSchema);
}

export function switchPark(parkId: number) {
  return apiPost(`/parks/${parkId}/switch`, null, sessionUserSchema);
}

export function updateCoverageSettings(parkId: number, neglectDays: number): Promise<null> {
  return apiPut(`/parks/${parkId}/coverage-settings`, { neglectDays }, z.null());
}

export function fetchSectors(parkId: number): Promise<SectorResponse[]> {
  return apiGet(`/parks/${parkId}/sectors`, z.array(sectorSchema));
}

export function createSector(parkId: number, request: SectorRequest): Promise<SectorResponse> {
  return apiPost(`/parks/${parkId}/sectors`, request, sectorSchema);
}

export function updateSector(parkId: number, sectorId: number, request: SectorRequest): Promise<SectorResponse> {
  return apiPut(`/parks/${parkId}/sectors/${sectorId}`, request, sectorSchema);
}

export function deleteSector(parkId: number, sectorId: number): Promise<void> {
  return apiDelete(`/parks/${parkId}/sectors/${sectorId}`);
}
