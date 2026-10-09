import { Card, CardTitle } from "@/components/ui/card";
import type { CountBar } from "@/lib/incidents/report-mappers";
import { cn } from "@/lib/utils";

export function RankedBars({ title, bars, empty }: { title: string; bars: CountBar[]; empty: string }) {
  return (
    <Card label={title}>
      <CardTitle>{title}</CardTitle>
      {bars.length === 0 && <p className="m-0 text-body text-ink-muted">{empty}</p>}
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {bars.map((bar) => (
          <li key={bar.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
            <span className={cn("truncate text-body text-ink-body", bar.highlighted && "font-semibold text-ink")}>{bar.label}</span>
            <span className="text-label text-ink">{bar.count}</span>
            <span className="col-span-2 h-6 overflow-hidden rounded-md bg-surface-muted">
              <span style={{ width: `${bar.widthPct}%` }} className={cn("block h-full rounded-md", bar.highlighted ? "bg-coral" : "bg-lime")} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
