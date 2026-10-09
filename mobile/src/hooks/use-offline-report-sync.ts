import { useEffect } from "react";
import { AppState } from "react-native";
import { OFFLINE_REPORTS_RETRY_MS } from "@/lib/constants";
import { OFFLINE_STATUSES } from "@/lib/offline-reports/repository";
import { sendWaitingReports } from "@/lib/offline-reports/sender";
import { refreshOfflineReports, useOfflineReports } from "@/lib/offline-reports/store";

export function useOfflineReportSync() {
  const waiting = useOfflineReports((state) => state.reports.filter((report) => report.status === OFFLINE_STATUSES.PENDING).length);

  useEffect(() => {
    refreshOfflineReports();
    void sendWaitingReports();
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void sendWaitingReports();
    });
    return () => app.remove();
  }, []);

  useEffect(() => {
    if (waiting === 0) return;
    const timer = setInterval(() => void sendWaitingReports(), OFFLINE_REPORTS_RETRY_MS);
    return () => clearInterval(timer);
  }, [waiting]);
}
