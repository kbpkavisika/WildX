import { z } from "zod";
import type { AnimalRequest, DeviceRequest } from "@/lib/api/devices";
import { DEVICE_TYPES } from "@/lib/enums";

const CODE_MAX_LENGTH = 50;
const TEXT_MAX_LENGTH = 255;
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 10_080;
const DEFAULT_INTERVAL = "60";
const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

function isNumberWithin(value: string, limit: number): boolean {
  const number = Number(value);
  return value !== "" && Number.isFinite(number) && Math.abs(number) <= limit;
}

export const LATITUDE_ERROR = `Enter a latitude from -${LATITUDE_LIMIT} to ${LATITUDE_LIMIT}`;
export const LONGITUDE_ERROR = `Enter a longitude from -${LONGITUDE_LIMIT} to ${LONGITUDE_LIMIT}`;

export function isLatitude(value: string): boolean {
  return isNumberWithin(value, LATITUDE_LIMIT);
}

export function isLongitude(value: string): boolean {
  return isNumberWithin(value, LONGITUDE_LIMIT);
}

export const deviceFormSchema = z
  .object({
    type: z.enum(DEVICE_TYPES),
    code: z.string().trim().min(1, "Enter a code").max(CODE_MAX_LENGTH, `Keep it under ${CODE_MAX_LENGTH} characters`),
    expectedIntervalMin: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value) && Number(value) >= INTERVAL_MIN && Number(value) <= INTERVAL_MAX, `Enter ${INTERVAL_MIN} to ${INTERVAL_MAX} minutes`),
    animalId: z.string(),
    lat: z.string().trim(),
    lng: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.type === DEVICE_TYPES.COLLAR && values.animalId === "") {
      ctx.addIssue({ code: "custom", path: ["animalId"], message: "Choose an animal" });
    }
    if (values.type === DEVICE_TYPES.CAMERA && !isLatitude(values.lat)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: LATITUDE_ERROR });
    }
    if (values.type === DEVICE_TYPES.CAMERA && !isLongitude(values.lng)) {
      ctx.addIssue({ code: "custom", path: ["lng"], message: LONGITUDE_ERROR });
    }
  });

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export const EMPTY_DEVICE: DeviceFormValues = {
  type: DEVICE_TYPES.COLLAR,
  code: "",
  expectedIntervalMin: DEFAULT_INTERVAL,
  animalId: "",
  lat: "",
  lng: "",
};

export function toDeviceRequest(values: DeviceFormValues): DeviceRequest {
  const collar = values.type === DEVICE_TYPES.COLLAR;
  return {
    type: values.type,
    code: values.code,
    expectedIntervalMin: Number(values.expectedIntervalMin),
    animalId: collar ? Number(values.animalId) : null,
    lat: collar ? null : Number(values.lat),
    lng: collar ? null : Number(values.lng),
  };
}

export const animalFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(TEXT_MAX_LENGTH, `Keep it under ${TEXT_MAX_LENGTH} characters`),
  species: z.string().trim().min(1, "Enter a species").max(TEXT_MAX_LENGTH, `Keep it under ${TEXT_MAX_LENGTH} characters`),
});

export type AnimalFormValues = z.infer<typeof animalFormSchema>;

export const EMPTY_ANIMAL: AnimalFormValues = { name: "", species: "" };

export function toAnimalRequest(values: AnimalFormValues): AnimalRequest {
  return { name: values.name, species: values.species };
}
