import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export const boundarySegmentSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  code: z.string(),
  name: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
});

export type BoundarySegment = z.infer<typeof boundarySegmentSchema>;

export interface BoundarySegmentInput {
  code: string;
  name: string;
  centerLat: number;
  centerLng: number;
}

export function fetchSegments(parkId: number): Promise<BoundarySegment[]> {
  return apiGet(`/parks/${parkId}/segments`, z.array(boundarySegmentSchema));
}

export function createSegment(parkId: number, data: BoundarySegmentInput): Promise<BoundarySegment> {
  return apiPost(`/parks/${parkId}/segments`, data, boundarySegmentSchema);
}

export function updateSegment(
  parkId: number,
  segmentId: number,
  data: BoundarySegmentInput
): Promise<BoundarySegment> {
  return apiPut(`/parks/${parkId}/segments/${segmentId}`, data, boundarySegmentSchema);
}

export function deleteSegment(parkId: number, segmentId: number): Promise<void> {
  return apiDelete(`/parks/${parkId}/segments/${segmentId}`);
}
