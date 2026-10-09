import { z } from "zod";
import { ALERT_TYPES } from "@/lib/enums";
import { apiGet, apiGetBlob } from "./client";

const rowSchema = z.object({
  type: z.enum(ALERT_TYPES),
  zoneId: z.number().nullable(),
  zoneName: z.string().nullable(),
  count: z.number(),
  medianAcknowledgeMinutes: z.number().nullable(),
  medianResolveMinutes: z.number().nullable(),
});

const reportSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  total: z.number(),
  medianAcknowledgeMinutes: z.number().nullable(),
  medianResolveMinutes: z.number().nullable(),
  rows: z.array(rowSchema),
});

export type AlertReportRowResponse = z.infer<typeof rowSchema>;
export type AlertReportResponse = z.infer<typeof reportSchema>;

function reportPath(from: string, to: string): string {
  return `/reports/alerts?from=${from}&to=${to}`;
}

export function fetchAlertReport(from: string, to: string): Promise<AlertReportResponse> {
  return apiGet(reportPath(from, to), reportSchema);
}

export function fetchAlertReportCsv(from: string, to: string): Promise<Blob> {
  return apiGetBlob(`${reportPath(from, to)}&format=csv`);
}
