import { ChevronsUpDown, EllipsisVertical, ListFilter } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { Metric } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

function MetricCell({ metric }: { metric: Metric }) {
  return (
    <div className="flex flex-col gap-2.5 px-5 pt-[18px] pb-1 not-last:border-r first:pl-0 last:pr-0 border-line">
      <span className="text-body text-ink-body">{metric.label}</span>
      <div className="flex items-center gap-3">
        <span className={cn("text-metric", metric.emphasis && "text-primary")}>
          {metric.value}
          {metric.total !== undefined && <span className="text-ink-faint">/{metric.total}</span>}
        </span>
        <Chip tone={metric.chip.tone}>{metric.chip.text}</Chip>
      </div>
    </div>
  );
}

interface ParkActivityProps {
  date: string;
  metrics: Metric[];
}

export function ParkActivity({ date, metrics }: ParkActivityProps) {
  return (
    <Card label="Park activity" className="gap-5">
      <div className="flex flex-wrap items-start gap-2">
        <div className="mr-auto flex flex-col gap-1">
          <CardTitle>Park activity</CardTitle>
          <span className="text-field-label font-normal text-ink-body">{date}</span>
        </div>
        <QuietButton>
          <ChevronsUpDown strokeWidth={2} />
          Today
        </QuietButton>
        <QuietButton>
          <ListFilter strokeWidth={2} />
          Filter
        </QuietButton>
        <QuietButton aria-label="More options" className="px-0">
          <EllipsisVertical fill="currentColor" />
        </QuietButton>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-t border-line">
        {metrics.map((metric) => (
          <MetricCell key={metric.label} metric={metric} />
        ))}
      </div>
    </Card>
  );
}
