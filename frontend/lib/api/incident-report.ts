import { z } from "zod";
import { INCIDENT_STATUSES, SEVERITIES } from "@/lib/enums";
import { apiGet, apiGetBlob } from "./client";

const countSchema = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
  count: z.number(),
});

const pointSchema = z.object({
  id: z.number(),
  occurredAt: z.iso.datetime({ offset: true }),
  typeName: z.string(),
  sectorName: z.string().nullable(),
  severity: z.enum(SEVERITIES),
  status: z.enum(INCIDENT_STATUSES),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});

const reportSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  total: z.number(),
  byType: z.array(countSchema),
  bySector: z.array(countSchema),
  byMonth: z.array(countSchema),
  points: z.array(pointSchema),
});

export type IncidentReportCount = z.infer<typeof countSchema>;
export type IncidentReportPoint = z.infer<typeof pointSchema>;
export type IncidentReportResponse = z.infer<typeof reportSchema>;

function reportPath(from: string, to: string): string {
  return `/reports/incidents?from=${from}&to=${to}`;
}

export function fetchIncidentReport(from: string, to: string): Promise<IncidentReportResponse> {
  return apiGet(reportPath(from, to), reportSchema);
}

export function fetchIncidentReportCsv(from: string, to: string): Promise<Blob> {
  return apiGetBlob(`${reportPath(from, to)}&format=csv`);
}
