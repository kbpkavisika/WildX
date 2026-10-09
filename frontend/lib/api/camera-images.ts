import { z } from "zod";
import { CAMERA_IMAGE_STATUSES } from "@/lib/enums";
import { apiGet, apiGetBlob } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const cameraImageSchema = z.object({
  id: z.number(),
  cameraCode: z.string(),
  capturedAt: timestamp,
  status: z.enum(CAMERA_IMAGE_STATUSES),
  species: z.string().nullable(),
  animalCount: z.number().nullable(),
  reviewedByName: z.string().nullable(),
  reviewedAt: timestamp.nullable(),
});

const cameraBurstSchema = z.object({
  cameraCode: z.string(),
  startedAt: timestamp,
  endedAt: timestamp,
  images: z.array(cameraImageSchema),
});

export type CameraImageResponse = z.infer<typeof cameraImageSchema>;
export type CameraBurstResponse = z.infer<typeof cameraBurstSchema>;

export function fetchCameraBursts(parkId: number): Promise<CameraBurstResponse[]> {
  return apiGet(`/parks/${parkId}/camera-images`, z.array(cameraBurstSchema));
}

export function fetchCameraImageFile(parkId: number, imageId: number): Promise<Blob> {
  return apiGetBlob(`/parks/${parkId}/camera-images/${imageId}/file`);
}
