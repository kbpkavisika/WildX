"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { useTrend } from "@/hooks/use-trend";
import { TREND_UNITS, type DayCount, type TrendUnit, type TrendView } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const UNIT_LABELS: Record<TrendUnit, string> = { day: "Day", week: "Week", month: "Month" };

interface TrendChartProps {
  title: string;
  empty: string;
  days: DayCount[];
  units?: readonly TrendUnit[];
}

function UnitSwitch({ units, unit, onChange }: { units: readonly TrendUnit[]; unit: TrendUnit; onChange: (unit: TrendUnit) => void }) {
  return (
    <div role="group" aria-label="Group by" className="flex gap-1 rounded-sm bg-surface-muted p-1">
      {units.map((option) => (
        <button
          key={option}
          aria-pressed={option === unit}
          onClick={() => onChange(option)}
          className={cn(
            "h-8 cursor-pointer rounded-sm px-3 text-field-label font-normal",
            option === unit ? "bg-ink text-white" : "text-ink-body hover:bg-card",
          )}
        >
          {UNIT_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

function linePath(view: TrendView): string {
  const points = view.bars.map((bar, index) => [index + 0.5, 100 - bar.averagePct]);
  return points
    .map(([x, y], index) => {
      if (index === 0) return `M ${x} ${y}`;
      const [px, py] = points[index - 1];
      const mid = (px + x) / 2;
      return `C ${mid} ${py} ${mid} ${y} ${x} ${y}`;
    })
    .join(" ");
}

function Callout({ view }: { view: TrendView }) {
  if (view.change === null) return null;
  const left = ((view.bars.length - 0.5) / view.bars.length) * 100;
  return (
    <div
      style={{ left: `clamp(64px, ${left}%, calc(100% - 64px))` }}
      className="absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-md bg-lime-soft px-4 py-2.5"
    >
      <span className="text-hero-number text-primary">{view.change}</span>
      <span className="whitespace-nowrap text-caption text-ink-body">{view.changeCaption}</span>
    </div>
  );
}

function Plot({ view }: { view: TrendView }) {
  const lastIndex = view.bars.length - 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[240px]">
        <Callout view={view} />
        <div className="absolute inset-0 flex items-end">
          {view.bars.map((bar, index) => (
            <div key={bar.key} title={bar.tooltip} className="flex h-full flex-1 items-end justify-center">
              <span
                style={{ height: `${bar.heightPct}%` }}
                className={cn("block w-[60%] max-w-3.5 min-w-0.5 rounded-t-sm", index === lastIndex ? "bg-coral" : "bg-primary/20")}
              />
            </div>
          ))}
        </div>
        <svg aria-hidden="true" viewBox={`0 0 ${view.bars.length} 100`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <path d={linePath(view)} fill="none" vectorEffect="non-scaling-stroke" className="stroke-primary" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
      <div className="relative h-4">
        {view.axis.map((tick) => (
          <span
            key={tick.index}
            style={{ left: `${((tick.index + 0.5) / view.bars.length) * 100}%` }}
            className="absolute -translate-x-1/2 whitespace-nowrap text-caption text-ink-muted"
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ title, empty, days, units = TREND_UNITS }: TrendChartProps) {
  const { unit, setUnit, view } = useTrend(days, units);
  return (
    <Card label={title}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <p className="m-0 text-caption text-ink-muted">
            <strong className="font-semibold text-ink">{view.total.toLocaleString("en-US")}</strong> in this range
          </p>
        </div>
        {units.length > 1 && <UnitSwitch units={units} unit={unit} onChange={setUnit} />}
      </div>
      {view.total === 0 ? <p className="m-0 text-body text-ink-muted">{empty}</p> : <Plot view={view} />}
    </Card>
  );
}
