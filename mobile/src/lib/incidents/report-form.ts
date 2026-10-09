import { z } from "zod";
import type { IncidentCreateRequest } from "@/lib/api/incidents";
import { INCIDENT_DESCRIPTION_MAX, PHOTO_MAX_MB } from "@/lib/constants";
import type { LocationSource } from "@/lib/enums";
import type { LatLng } from "@/lib/geo";

const BYTES_PER_MB = 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png"];

export interface PickedLocation {
  position: LatLng;
  source: LocationSource;
}

export interface TakenPhoto {
  uri: string;
  mimeType: string;
  fileSize: number;
}

export const reportIncidentSchema = z.object({
  typeId: z.string().min(1, "Choose a type"),
  location: z.custom<PickedLocation | null>().transform((value, ctx) => {
    if (value) return value;
    ctx.addIssue({ code: "custom", message: "Tap the map to set the location" });
    return z.NEVER;
  }),
  description: z.string().trim().max(INCIDENT_DESCRIPTION_MAX, `Keep it under ${INCIDENT_DESCRIPTION_MAX} characters`),
  photo: z
    .custom<TakenPhoto | null>()
    .refine((photo) => photo === null || PHOTO_TYPES.includes(photo.mimeType), "Use a JPEG or PNG photo")
    .refine((photo) => photo === null || photo.fileSize <= PHOTO_MAX_MB * BYTES_PER_MB, `Photo must be ${PHOTO_MAX_MB} MB or smaller`),
});

export type ReportIncidentValues = z.input<typeof reportIncidentSchema>;
export type ReportIncidentSubmit = z.output<typeof reportIncidentSchema>;

export const EMPTY_REPORT: ReportIncidentValues = { typeId: "", location: null, description: "", photo: null };

export function toIncidentCreateRequest(clientId: string, values: ReportIncidentSubmit, now: Date): IncidentCreateRequest {
  const [lat, lng] = values.location.position;
  return {
    clientId,
    typeId: Number(values.typeId),
    lat,
    lng,
    locationSource: values.location.source,
    description: values.description === "" ? null : values.description,
    occurredAt: now.toISOString(),
  };
}
