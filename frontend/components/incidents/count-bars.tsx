import { Card, CardTitle } from "@/components/ui/card";
import type { CountBar } from "@/lib/incidents/report-mappers";
import { cn } from "@/lib/utils";

export function CountBars({ title, bars }: { title: string; bars: CountBar[] }) {
  return (
    <Card label={title}>
      <CardTitle>{title}</CardTitle>
      {bars.length === 0 && <p className="m-0 text-body text-ink-muted">No incidents in this range.</p>}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {bars.map((bar) => (
          <li key={bar.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
            <span className={cn("truncate text-body text-ink-body", bar.highlighted && "font-semibold text-ink")}>{bar.label}</span>
            <span className={cn("text-body text-ink", bar.highlighted && "font-semibold")}>{bar.count}</span>
            <span className="col-span-2 h-2 overflow-hidden rounded-full bg-surface-sunken">
              <span
                style={{ width: `${bar.widthPct}%` }}
                className={cn("block h-full rounded-full", bar.highlighted ? "bg-coral" : "bg-primary")}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
