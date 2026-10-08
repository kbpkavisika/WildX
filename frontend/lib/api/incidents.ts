import { z } from "zod";
import { INCIDENT_STATUSES, type LocationSource } from "@/lib/enums";
import { apiGet, apiPostForm } from "./client";

const incidentSchema = z.object({
  id: z.number(),
  typeName: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  sectorName: z.string().nullable(),
  status: z.enum(INCIDENT_STATUSES),
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

export function reportIncident(request: IncidentCreateRequest, photo: File | null): Promise<IncidentResponse> {
  const body = new FormData();
  body.append("data", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (photo) body.append("photo", photo);
  return apiPostForm("/incidents", body, incidentSchema);
}
