import { z } from "zod";
import { SEVERITIES, type Severity } from "@/lib/enums";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

const incidentTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  defaultSeverity: z.enum(SEVERITIES),
  active: z.boolean(),
});

export type IncidentTypeResponse = z.infer<typeof incidentTypeSchema>;

export interface IncidentTypeRequest {
  name: string;
  defaultSeverity: Severity;
  active: boolean;
}

function typesPath(parkId: number): string {
  return `/parks/${parkId}/incident-types`;
}

export function fetchIncidentTypes(parkId: number): Promise<IncidentTypeResponse[]> {
  return apiGet(typesPath(parkId), z.array(incidentTypeSchema));
}

export function createIncidentType(parkId: number, request: IncidentTypeRequest): Promise<IncidentTypeResponse> {
  return apiPost(typesPath(parkId), request, incidentTypeSchema);
}

export function updateIncidentType(parkId: number, typeId: number, request: IncidentTypeRequest): Promise<IncidentTypeResponse> {
  return apiPut(`${typesPath(parkId)}/${typeId}`, request, incidentTypeSchema);
}

export function deleteIncidentType(parkId: number, typeId: number): Promise<void> {
  return apiDelete(`${typesPath(parkId)}/${typeId}`);
}
