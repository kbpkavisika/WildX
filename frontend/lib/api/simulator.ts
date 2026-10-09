import { z } from "zod";
import type { SimulationScenario } from "@/lib/enums";
import { apiPost } from "./client";

const simulationSchema = z.object({
  sent: z.number(),
  stored: z.number(),
  duplicates: z.number(),
});

export type SimulationResponse = z.infer<typeof simulationSchema>;

export interface CollarSimulationRequest {
  collarCode: string;
  scenario: SimulationScenario;
  lat: number | null;
  lng: number | null;
  zoneId: number | null;
}

export interface CameraSimulationRequest {
  cameraCode: string;
  count: number;
}

export function simulateCollarFixes(parkId: number, request: CollarSimulationRequest): Promise<SimulationResponse> {
  return apiPost(`/parks/${parkId}/simulator/collar-fixes`, request, simulationSchema);
}

export function simulateCameraImages(parkId: number, request: CameraSimulationRequest): Promise<SimulationResponse> {
  return apiPost(`/parks/${parkId}/simulator/camera-images`, request, simulationSchema);
}
