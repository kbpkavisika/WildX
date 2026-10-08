import { z } from "zod";
import { ALERT_STATUSES, ALERT_TYPES, DISPOSITIONS, SEVERITIES, type Disposition } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const alertSchema = z.object({
  id: z.number(),
  type: z.enum(ALERT_TYPES),
  severity: z.enum(SEVERITIES),
  status: z.enum(ALERT_STATUSES),
  deviceId: z.number().nullable(),
  collarCode: z.string().nullable(),
  animalName: z.string().nullable(),
  zoneId: z.number().nullable(),
  zoneName: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  occurredAt: timestamp,
  slaDueAt: timestamp.nullable(),
  acknowledgedByName: z.string().nullable(),
  acknowledgedAt: timestamp.nullable(),
  resolvedAt: timestamp.nullable(),
  disposition: z.enum(DISPOSITIONS).nullable(),
  escalationLevel: z.number(),
  cameraImageId: z.number().nullable(),
});

export type AlertResponse = z.infer<typeof alertSchema>;

export function fetchAlerts(): Promise<AlertResponse[]> {
  return apiGet("/alerts", z.array(alertSchema));
}

export function acknowledgeAlert(id: number): Promise<AlertResponse> {
  return apiPost(`/alerts/${id}/acknowledge`, {}, alertSchema);
}

export function resolveAlert(id: number, disposition: Disposition): Promise<AlertResponse> {
  return apiPost(`/alerts/${id}/resolve`, { disposition }, alertSchema);
}
