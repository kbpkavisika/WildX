import { z } from "zod";
import type { IncidentCreateRequest } from "@/lib/api/incidents";
import { LOCATION_SOURCES } from "@/lib/enums";
import { offlineDb } from "./database";

export const OFFLINE_STATUSES = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
} as const;
export type OfflineStatus = (typeof OFFLINE_STATUSES)[keyof typeof OFFLINE_STATUSES];

export interface OfflineReport {
  id: string;
  typeName: string;
  request: IncidentCreateRequest;
  photoUri: string | null;
  createdAt: number;
  status: OfflineStatus;
  error: string | null;
}

interface OfflineReportRecord {
  id: string;
  type_name: string;
  body: string;
  photo_uri: string | null;
  created_at: number;
  status: OfflineStatus;
  error: string | null;
}

const requestSchema = z.object({
  clientId: z.string(),
  typeId: z.number(),
  lat: z.number(),
  lng: z.number(),
  locationSource: z.enum(LOCATION_SOURCES),
  description: z.string().nullable(),
  occurredAt: z.string(),
});

function toReport(record: OfflineReportRecord): OfflineReport {
  return {
    id: record.id,
    typeName: record.type_name,
    request: requestSchema.parse(JSON.parse(record.body)),
    photoUri: record.photo_uri,
    createdAt: record.created_at,
    status: record.status,
    error: record.error,
  };
}

export function insertReport(userId: number, typeName: string, request: IncidentCreateRequest, photoUri: string | null): void {
  offlineDb().runSync(
    "INSERT INTO offline_report (id, user_id, type_name, body, photo_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    request.clientId,
    userId,
    typeName,
    JSON.stringify(request),
    photoUri,
    Date.now(),
  );
}

export function reportsOf(userId: number): OfflineReport[] {
  return offlineDb()
    .getAllSync<OfflineReportRecord>("SELECT * FROM offline_report WHERE user_id = ? ORDER BY created_at, rowid", userId)
    .map(toReport);
}

export function rejectReport(id: string, error: string): void {
  offlineDb().runSync("UPDATE offline_report SET status = ?, error = ? WHERE id = ?", OFFLINE_STATUSES.REJECTED, error, id);
}

export function deleteReport(id: string): void {
  offlineDb().runSync("DELETE FROM offline_report WHERE id = ?", id);
}
