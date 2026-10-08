import { z } from "zod";
import { apiGet, apiGetBlob, apiPost, apiPut } from "./client";

export const communityReportSchema = z.object({
  id: z.number(),
  referenceCode: z.string(),
  parkId: z.number(),
  segmentId: z.number().nullable(),
  segmentCode: z.string().nullable(),
  segmentName: z.string().nullable(),
  channel: z.string(),
  reporterPhone: z.string(),
  type: z.string(),
  animalCount: z.number(),
  description: z.string().nullable(),
  photoPath: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  rawText: z.string().nullable(),
  status: z.string(),
  duplicateOfId: z.number().nullable(),
  duplicateOfRef: z.string().nullable(),
  severity: z.string().nullable(),
  invalidReason: z.string().nullable(),
  outcome: z.string().nullable(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
});

export type CommunityReport = z.infer<typeof communityReportSchema>;

export const hotspotSchema = z.object({
  segmentId: z.number(),
  segmentCode: z.string(),
  segmentName: z.string(),
  conflictCount: z.number(),
  isHotspot: z.boolean(),
});

export type Hotspot = z.infer<typeof hotspotSchema>;

export const keywordHelpSchema = z.object({
  type: z.string(),
  label: z.string(),
  english: z.string(),
  sinhala: z.string(),
  tamil: z.string(),
});

export const landmarkHelpSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  centerLat: z.number().optional().nullable(),
  centerLng: z.number().optional().nullable(),
});

export const smsHelpCardSchema = z.object({
  parkId: z.number(),
  parkName: z.string(),
  shortCode: z.string(),
  format: z.string(),
  example: z.string(),
  helpReply: z.string(),
  keywords: z.array(keywordHelpSchema),
  landmarks: z.array(landmarkHelpSchema),
});

export type SmsHelpCard = z.infer<typeof smsHelpCardSchema>;

export const conflictTrendSchema = z.object({
  month: z.string(),
  segmentId: z.number(),
  segmentCode: z.string(),
  segmentName: z.string(),
  conflictCount: z.number(),
});

export type ConflictTrend = z.infer<typeof conflictTrendSchema>;

export function fetchConflictTrends(from: string, to: string, parkId?: number): Promise<ConflictTrend[]> {
  const query = parkId ? `&parkId=${parkId}` : "";
  return apiGet(`/reports/conflicts?from=${from}&to=${to}${query}&format=json`, z.array(conflictTrendSchema));
}

export function fetchConflictTrendsCsv(from: string, to: string, parkId?: number): Promise<Blob> {
  const query = parkId ? `&parkId=${parkId}` : "";
  return apiGetBlob(`/reports/conflicts?from=${from}&to=${to}${query}&format=csv`);
}

export function fetchCommunityReports(status?: string, parkId?: number): Promise<CommunityReport[]> {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (parkId) params.set("parkId", String(parkId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGet(`/community-reports${query}`, z.array(communityReportSchema));
}

export function fetchCommunityReport(id: number, parkId?: number): Promise<CommunityReport> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiGet(`/community-reports/${id}${query}`, communityReportSchema);
}

export function updateReportLocation(
  id: number,
  payload: { segmentId: number; landmarkCode?: string; lat?: number; lng?: number },
  parkId?: number
): Promise<CommunityReport> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiPut(`/community-reports/${id}/location${query}`, payload, communityReportSchema);
}

export function validateReport(id: number, severity: string, parkId?: number): Promise<CommunityReport> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiPost(`/community-reports/${id}/validate${query}`, { severity }, communityReportSchema);
}

export function invalidateReport(id: number, reason: string, parkId?: number): Promise<CommunityReport> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiPost(`/community-reports/${id}/invalidate${query}`, { reason }, communityReportSchema);
}

export function fetchHotspots(parkId?: number): Promise<Hotspot[]> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiGet(`/community/hotspots${query}`, z.array(hotspotSchema));
}

export function fetchSmsHelpCard(parkId?: number): Promise<SmsHelpCard> {
  const query = parkId ? `?parkId=${parkId}` : "";
  return apiGet(`/community/sms-help-card${query}`, smsHelpCardSchema);
}
