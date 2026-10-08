import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchIncidentReport, fetchIncidentReportCsv } from "@/lib/api/incident-report";
import { downloadBlob } from "@/lib/files";
import { reportRangeError, toIncidentReportView } from "@/lib/incidents/report-mappers";
import { useIncidentReportRange } from "@/lib/incidents/store";

export function useIncidentReport() {
  const { from, to, setRange } = useIncidentReportRange();
  const rangeError = reportRangeError(from, to);

  const report = useQuery({
    queryKey: ["reports", "incidents", from, to],
    queryFn: () => fetchIncidentReport(from, to),
    enabled: rangeError === null,
  });

  const csv = useMutation({
    mutationFn: () => fetchIncidentReportCsv(from, to),
    onSuccess: (blob) => downloadBlob(blob, `incidents-${from}-${to}.csv`),
  });

  return {
    from,
    to,
    setRange,
    rangeError,
    isPending: rangeError === null && report.isPending,
    isError: report.isError,
    view: rangeError === null && report.data ? toIncidentReportView(report.data) : undefined,
    csv,
  };
}
