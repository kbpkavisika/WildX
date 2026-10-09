import { Card, CardTitle } from "@/components/ui/card";
import { MetricRow } from "@/components/ui/metric-row";
import type { AlertReportMetric } from "@/lib/alerts/report-types";

export function AlertReportSummary({ metrics }: { metrics: AlertReportMetric[] }) {
  return (
    <Card label="Summary">
      <div className="flex flex-col gap-1">
        <CardTitle>Summary</CardTitle>
        <p className="m-0 text-caption text-ink-muted">Times run from when each alert was raised, and count only alerts that got that far.</p>
      </div>
      <MetricRow metrics={metrics} />
    </Card>
  );
}
