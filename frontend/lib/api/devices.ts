import { z } from "zod";
import { DEVICE_TYPES } from "@/lib/enums";
import { apiGet } from "./client";

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

export function fetchDevices(parkId: number): Promise<DeviceResponse[]> {
  return apiGet(`/parks/${parkId}/devices`, z.array(deviceSchema));
}
