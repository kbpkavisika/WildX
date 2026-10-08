import { z } from "zod";
import { INCIDENT_STATUSES } from "@/lib/enums";
import { apiGet } from "./client";

const incidentSchema = z.object({
  id: z.number(),
  typeName: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  sectorName: z.string().nullable(),
  status: z.enum(INCIDENT_STATUSES),
});

export type IncidentResponse = z.infer<typeof incidentSchema>;

export function fetchIncidents(): Promise<IncidentResponse[]> {
  return apiGet("/incidents", z.array(incidentSchema));
}
