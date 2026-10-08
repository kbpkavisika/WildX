import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MoreButton } from "@/components/ui/more-button";
import type { ConflictChart as ConflictChartData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const GRID = "grid grid-cols-6 gap-3";

export function ConflictChart({ chart }: { chart: ConflictChartData }) {
  const Arrow = chart.improving ? ArrowDown : ArrowUp;
  return (
    <Card label="Incidents this season" className="flex-[3_1_420px]">
      <div className="flex items-center">
        <div className="mr-auto">
          <CardTitle>Human–elephant conflict</CardTitle>
        </div>
        <MoreButton label="More options" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto flex flex-col gap-1">
          <span className="text-hero-number">{chart.total} incidents</span>
          <span className="text-body text-ink-body">{chart.period}</span>
        </div>
        <span className="flex items-center gap-2 text-body text-ink-body">
          <Chip tone={chart.improving ? "positive" : "negative"} className="text-field-label">
            <Arrow className="size-3" strokeWidth={2.5} />
            {chart.changePct}%
          </Chip>
          vs last season
        </span>
      </div>
      <div className={cn(GRID, "relative mt-2 h-[230px] items-end")}>
        {chart.bars.map((bar) => (
          <div
            key={bar.label}
            style={{ height: `${bar.heightPct}%` }}
            className={cn(
              "flex justify-center rounded-[14px] pt-3 text-caption",
              bar.highlighted ? "bg-coral font-semibold text-primary-foreground shadow-[0_6px_0_var(--coral-deep)]" : "bg-surface-sunken text-ink-body",
            )}
          >
            {bar.value}
          </div>
        ))}
        <div style={{ bottom: `${chart.averagePct}%` }} className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dotted border-ink-faint" />
        <span
          style={{ bottom: `${chart.averagePct}%` }}
          className="absolute left-0 translate-y-1/2 rounded-l-xs bg-primary px-2 py-[3px] text-[11px] font-semibold text-primary-foreground"
        >
          Avg {chart.average}
        </span>
      </div>
      <div className={cn(GRID, "text-center text-body text-ink-muted")}>
        {chart.bars.map((bar) => (
          <span key={bar.label} className={cn(bar.highlighted && "font-semibold text-ink")}>
            {bar.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
