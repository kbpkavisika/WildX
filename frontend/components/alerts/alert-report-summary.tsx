import { Card, CardTitle } from "@/components/ui/card";
import type { AlertReportMetric } from "@/lib/alerts/report-types";

export function AlertReportSummary({ metrics }: { metrics: AlertReportMetric[] }) {
  return (
    <Card label="Summary">
      <div className="flex flex-col gap-1">
        <CardTitle>Summary</CardTitle>
        <p className="m-0 text-caption text-ink-muted">Times run from when each alert was raised, and count only alerts that got that far.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-t border-line">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-2.5 border-line pt-[18px] pb-1 sm:px-5 sm:first:pl-0 sm:last:pr-0 sm:not-last:border-r">
            <span className="text-body text-ink-body">{metric.label}</span>
            <span className="text-metric">{metric.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
