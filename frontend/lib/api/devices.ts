import { z } from "zod";
import { DEVICE_TYPES, type DeviceType } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const animalSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  name: z.string(),
  species: z.string(),
});

const deviceSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  type: z.enum(DEVICE_TYPES),
  code: z.string(),
  expectedIntervalMin: z.number(),
  animal: animalSchema.nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  batteryPct: z.number().nullable(),
  lastSeenAt: z.iso.datetime({ offset: true }).nullable(),
});

export type AnimalResponse = z.infer<typeof animalSchema>;
export type DeviceResponse = z.infer<typeof deviceSchema>;

export interface AnimalRequest {
  name: string;
  species: string;
}

export interface DeviceRequest {
  type: DeviceType;
  code: string;
  expectedIntervalMin: number;
  animalId: number | null;
  lat: number | null;
  lng: number | null;
}

export function fetchDevices(parkId: number): Promise<DeviceResponse[]> {
  return apiGet(`/parks/${parkId}/devices`, z.array(deviceSchema));
}

export function fetchAnimals(parkId: number): Promise<AnimalResponse[]> {
  return apiGet(`/parks/${parkId}/animals`, z.array(animalSchema));
}

export function createAnimal(parkId: number, request: AnimalRequest): Promise<AnimalResponse> {
  return apiPost(`/parks/${parkId}/animals`, request, animalSchema);
}

export function createDevice(parkId: number, request: DeviceRequest): Promise<DeviceResponse> {
  return apiPost(`/parks/${parkId}/devices`, request, deviceSchema);
}
