import { z } from "zod";
import type { ParkRequest, SectorRequest, SectorResponse } from "@/lib/api/parks";
import { counted } from "@/lib/devices/mappers";
import { BOUNDARY_ERROR, parseBoundary } from "@/lib/zones/zone-form";

const NAME_MAX_LENGTH = 255;
const CODE_MAX_LENGTH = 20;
const BOUNDARY_MAX_LENGTH = 100_000;
const MIN_NEGLECT_DAYS = 1;
const MAX_NEGLECT_DAYS = 3650;
const NEGLECT_ERROR = `Enter ${MIN_NEGLECT_DAYS} to ${MAX_NEGLECT_DAYS} days`;

const nameSchema = z.string().trim().min(1, "Enter a name").max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters`);

export const parkFormSchema = z.object({
  name: nameSchema,
  code: z.string().trim().min(1, "Enter a code").max(CODE_MAX_LENGTH, `Keep it under ${CODE_MAX_LENGTH} characters`),
});

export type ParkFormValues = z.infer<typeof parkFormSchema>;

export const EMPTY_PARK: ParkFormValues = { name: "", code: "" };

export function toParkRequest(values: ParkFormValues): ParkRequest {
  return { name: values.name, code: values.code.toUpperCase() };
}

export const sectorFormSchema = z.object({
  name: nameSchema,
  boundary: z
    .string()
    .trim()
    .max(BOUNDARY_MAX_LENGTH, "This boundary is too long")
    .refine((value) => parseBoundary(value) !== null, BOUNDARY_ERROR),
});

export type SectorFormValues = z.infer<typeof sectorFormSchema>;

export const EMPTY_SECTOR: SectorFormValues = { name: "", boundary: "" };

export function toSectorValues(sector: SectorResponse): SectorFormValues {
  return { name: sector.name, boundary: sector.polygonGeojson };
}

export function toSectorRequest(values: SectorFormValues): SectorRequest {
  return { name: values.name, polygonGeojson: values.boundary };
}

export function sectorCaption(sector: SectorResponse): string {
  const rings = parseBoundary(sector.polygonGeojson) ?? [];
  return counted(rings.length > 0 ? rings[0].length - 1 : 0, "corner", "corners");
}

export const neglectFormSchema = z.object({
  neglectDays: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= MIN_NEGLECT_DAYS && Number(value) <= MAX_NEGLECT_DAYS, NEGLECT_ERROR),
});

export type NeglectFormValues = z.infer<typeof neglectFormSchema>;
