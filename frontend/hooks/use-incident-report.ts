import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchIncidentReport, fetchIncidentReportCsv } from "@/lib/api/incident-report";
import { canViewIncidents } from "@/lib/auth/routes";
import { useAuthStore } from "@/lib/auth/store";
import { downloadBlob } from "@/lib/files";
import { reportRangeError, toIncidentReportView } from "@/lib/incidents/report-mappers";
import { useIncidentReportRange } from "@/lib/incidents/store";

export function useIncidentReport() {
  const { from, to, setRange } = useIncidentReportRange();
  const rangeError = reportRangeError(from, to);
  const allowed = useAuthStore((state) => canViewIncidents(state.user?.role));

  const report = useQuery({
    queryKey: ["reports", "incidents", from, to],
    queryFn: () => fetchIncidentReport(from, to),
    enabled: allowed && rangeError === null,
  });

  const csv = useMutation({
    mutationFn: () => fetchIncidentReportCsv(from, to),
    onSuccess: (blob) => downloadBlob(blob, `incidents-${from}-${to}.csv`),
  });

  return {
    allowed,
    from,
    to,
    setRange,
    rangeError,
    isPending: allowed && rangeError === null && report.isPending,
    isError: report.isError,
    view: rangeError === null && report.data ? toIncidentReportView(report.data) : undefined,
    csv,
  };
}
