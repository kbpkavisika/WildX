import { z } from "zod";
import { INCIDENT_STATUSES, LOCATION_SOURCES, SEVERITIES, type LocationSource, type Severity } from "@/lib/enums";
import { apiGet, apiGetBlob, apiPatch, apiPost, apiPostForm } from "./client";

const incidentSchema = z.object({
  id: z.number(),
  typeId: z.number(),
  typeName: z.string(),
  reporterName: z.string(),
  patrolId: z.number().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  locationSource: z.enum(LOCATION_SOURCES),
  sectorName: z.string().nullable(),
  description: z.string().nullable(),
  photoPath: z.string().nullable(),
  severity: z.enum(SEVERITIES),
  status: z.enum(INCIDENT_STATUSES),
  occurredAt: z.iso.datetime({ offset: true }),
  resolutionNote: z.string().nullable(),
});

export type IncidentResponse = z.infer<typeof incidentSchema>;

export interface IncidentCreateRequest {
  typeId: number;
  lat: number;
  lng: number;
  locationSource: LocationSource;
  description: string | null;
  occurredAt: string;
}

export function fetchIncidents(): Promise<IncidentResponse[]> {
  return apiGet("/incidents", z.array(incidentSchema));
}

export function fetchIncident(id: number): Promise<IncidentResponse> {
  return apiGet(`/incidents/${id}`, incidentSchema);
}

export function fetchIncidentPhoto(id: number): Promise<Blob> {
  return apiGetBlob(`/incidents/${id}/photo`);
}

export function changeIncidentSeverity(id: number, severity: Severity): Promise<IncidentResponse> {
  return apiPatch(`/incidents/${id}`, { severity }, incidentSchema);
}

export function dismissIncident(id: number, reason: string): Promise<IncidentResponse> {
  return apiPost(`/incidents/${id}/dismiss`, { reason }, incidentSchema);
}

export function reportIncident(request: IncidentCreateRequest, photo: File | null): Promise<IncidentResponse> {
  const body = new FormData();
  body.append("data", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (photo) body.append("photo", photo);
  return apiPostForm("/incidents", body, incidentSchema);
}
