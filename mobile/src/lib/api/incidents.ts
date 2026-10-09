import { File, Paths } from "expo-file-system";
import { z } from "zod";
import { INCIDENT_STATUSES, LOCATION_SOURCES, SEVERITIES, type LocationSource } from "@/lib/enums";
import { apiGet, apiPostForm, apiUrl, authHeaders } from "./client";

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
  responderName: z.string().nullable(),
});

const incidentTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
});

const sectorSchema = z.object({ id: z.number(), name: z.string(), polygonGeojson: z.string() });

export type IncidentResponse = z.infer<typeof incidentSchema>;
export type IncidentTypeResponse = z.infer<typeof incidentTypeSchema>;
export type SectorResponse = z.infer<typeof sectorSchema>;

export interface IncidentCreateRequest {
  clientId: string;
  typeId: number;
  lat: number;
  lng: number;
  locationSource: LocationSource;
  description: string | null;
  occurredAt: string;
}

export function fetchMyIncidents(): Promise<IncidentResponse[]> {
  return apiGet("/me/incidents", z.array(incidentSchema));
}

export function fetchIncident(id: number): Promise<IncidentResponse> {
  return apiGet(`/incidents/${id}`, incidentSchema);
}

export function incidentPhotoSource(id: number): { uri: string; headers: Record<string, string> } {
  return { uri: apiUrl(`/incidents/${id}/photo`), headers: authHeaders() };
}

export function fetchIncidentTypes(parkId: number): Promise<IncidentTypeResponse[]> {
  return apiGet(`/parks/${parkId}/incident-types`, z.array(incidentTypeSchema));
}

export function fetchSectors(parkId: number): Promise<SectorResponse[]> {
  return apiGet(`/parks/${parkId}/sectors`, z.array(sectorSchema));
}

export async function reportIncident(request: IncidentCreateRequest, photoUri: string | null): Promise<IncidentResponse> {
  const data = new File(Paths.cache, `incident-${request.clientId}.json`);
  data.write(JSON.stringify(request));
  const body = new FormData();
  body.append("data", data);
  if (photoUri) body.append("photo", new File(photoUri));
  try {
    return await apiPostForm("/incidents", body, incidentSchema);
  } finally {
    data.delete();
  }
}
