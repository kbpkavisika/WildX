import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAlertReport, fetchAlertReportCsv } from "@/lib/api/alert-report";
import { toAlertReportView } from "@/lib/alerts/report-mappers";
import { useAlertReportRange } from "@/lib/alerts/report-store";
import { canViewAlertReport } from "@/lib/alerts/roles";
import { useAuthStore } from "@/lib/auth/store";
import { downloadBlob } from "@/lib/files";
import { reportRangeError } from "@/lib/incidents/report-mappers";

export function useAlertReport() {
  const canView = useAuthStore((state) => canViewAlertReport(state.user?.role ?? null));
  const { from, to, setRange } = useAlertReportRange();
  const rangeError = reportRangeError(from, to);
  const enabled = canView && rangeError === null;

  const report = useQuery({
    queryKey: ["reports", "alerts", from, to],
    queryFn: () => fetchAlertReport(from, to),
    enabled,
  });

  const csv = useMutation({
    mutationFn: () => fetchAlertReportCsv(from, to),
    onSuccess: (blob) => downloadBlob(blob, `alerts-${from}-${to}.csv`),
  });

  return {
    canView,
    from,
    to,
    setRange,
    rangeError,
    isPending: enabled && report.isPending,
    isError: report.isError,
    view: enabled && report.data ? toAlertReportView(report.data) : undefined,
    csv,
  };
}
