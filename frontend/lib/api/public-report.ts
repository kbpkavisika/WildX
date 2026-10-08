import { z } from "zod";
import { apiGet, apiPost, apiPostForm } from "./client";

export const boundarySegmentSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  code: z.string(),
  name: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
});

export type BoundarySegment = z.infer<typeof boundarySegmentSchema>;

export const publicReportResponseSchema = z.object({
  referenceCode: z.string(),
  status: z.string(),
  type: z.string(),
  animalCount: z.number(),
  description: z.string().nullable(),
  landmarkCode: z.string().nullable(),
  segmentName: z.string().nullable(),
  photoPath: z.string().nullable(),
  outcome: z.string().nullable(),
  createdAt: z.string().nullable(),
  closedAt: z.string().nullable(),
});

export type PublicReportResponse = z.infer<typeof publicReportResponseSchema>;

export interface PublicReportInput {
  parkId: number;
  type: "SIGHTING" | "CROP_DAMAGE" | "OTHER";
  animalCount: number;
  description?: string;
  reporterPhone: string;
  landmarkCode?: string;
  segmentId?: number;
  lat?: number;
  lng?: number;
}

export function fetchPublicSegments(parkId: number = 1): Promise<BoundarySegment[]> {
  return apiGet(`/public/parks/${parkId}/segments`, z.array(boundarySegmentSchema));
}

export function fetchPublicReport(ref: string): Promise<PublicReportResponse> {
  return apiGet(`/public/reports/${encodeURIComponent(ref)}`, publicReportResponseSchema);
}

export async function submitPublicReport(input: PublicReportInput, photo?: File): Promise<PublicReportResponse> {
  if (photo) {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(input)], { type: "application/json" });
    formData.append("data", jsonBlob);
    formData.append("photo", photo);
    return apiPostForm("/public/reports", formData, publicReportResponseSchema);
  }
  return apiPost("/public/reports", input, publicReportResponseSchema);
}
