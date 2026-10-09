import { isRetryable, isUnauthorized } from "@/lib/api/client";
import { reportIncident, type IncidentCreateRequest } from "@/lib/api/incidents";
import { useSession } from "@/lib/auth/store";
import { queryClient } from "@/lib/query-client";
import { deletePhoto, keepPhoto } from "./photos";
import { deleteReport, insertReport, OFFLINE_STATUSES, rejectReport, reportsOf, type OfflineReport } from "./repository";
import { refreshOfflineReports } from "./store";

const REJECTED_FALLBACK = "Rejected by the server";

let running: Promise<void> | null = null;

export async function saveOffline(typeName: string, request: IncidentCreateRequest, photoUri: string | null): Promise<void> {
  const user = useSession.getState().user;
  if (!user) throw new Error("Sign in again to save this report.");
  const kept = photoUri ? await keepPhoto(request.clientId, photoUri) : null;
  insertReport(user.id, typeName, request, kept);
  refreshOfflineReports();
}

export function discardReport(report: OfflineReport): void {
  deleteReport(report.id);
  deletePhoto(report.photoUri);
  refreshOfflineReports();
}

async function sendOne(report: OfflineReport): Promise<"sent" | "rejected" | "stop"> {
  try {
    await reportIncident(report.request, report.photoUri);
  } catch (error) {
    if (isRetryable(error) || isUnauthorized(error)) return "stop";
    rejectReport(report.id, error instanceof Error ? error.message : REJECTED_FALLBACK);
    return "rejected";
  }
  deleteReport(report.id);
  deletePhoto(report.photoUri);
  return "sent";
}

async function drain(): Promise<void> {
  const { user, token } = useSession.getState();
  if (!user || !token) return;
  const waiting = reportsOf(user.id).filter((report) => report.status === OFFLINE_STATUSES.PENDING);
  let sent = 0;
  for (const report of waiting) {
    const result = await sendOne(report);
    if (result === "stop") break;
    if (result === "sent") sent += 1;
  }
  refreshOfflineReports();
  if (sent > 0) void queryClient.invalidateQueries({ queryKey: ["incidents"] });
}

export function sendWaitingReports(): Promise<void> {
  running ??= drain().finally(() => {
    running = null;
  });
  return running;
}
