import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchCoverageDaily, fetchCoverageReport, fetchCoverageReportCsv } from "@/lib/api/patrols";
import { downloadBlob } from "@/lib/files";
import { reportRangeError } from "@/lib/incidents/report-mappers";
import { toCoverageReportView } from "@/lib/patrols/coverage-mappers";
import { useCoverageReportRange } from "@/lib/patrols/store";

export function useCoverageReport() {
  const { from, to, setRange } = useCoverageReportRange();
  const rangeError = reportRangeError(from, to);
  const enabled = rangeError === null;

  const report = useQuery({
    queryKey: ["reports", "coverage", from, to],
    queryFn: () => fetchCoverageReport(from, to),
    enabled,
  });

  const daily = useQuery({
    queryKey: ["reports", "coverage", "daily", from, to],
    queryFn: () => fetchCoverageDaily(from, to),
    enabled,
  });

  const csv = useMutation({
    mutationFn: () => fetchCoverageReportCsv(from, to),
    onSuccess: (blob) => downloadBlob(blob, `coverage-${from}-${to}.csv`),
  });

  return {
    from,
    to,
    setRange,
    rangeError,
    isPending: enabled && report.isPending,
    isError: report.isError,
    view: enabled && report.data ? toCoverageReportView(report.data, new Date()) : undefined,
    days: daily.data ?? [],
    csv,
  };
}
