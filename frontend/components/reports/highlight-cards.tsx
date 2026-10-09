import { AlertTriangle, ChartColumn, Clock, MapPin, Trophy, type LucideIcon } from "lucide-react";
import type { Highlight, HighlightIcon } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const ICONS: Record<HighlightIcon, LucideIcon> = { total: ChartColumn, top: Trophy, place: MapPin, warning: AlertTriangle, time: Clock };
const TINTS = ["bg-lime-soft", "bg-butter", "bg-orchid"];

export function HighlightCards({ highlights }: { highlights: Highlight[] }) {
  return (
    <div className="flex flex-col gap-5">
      {highlights.map((highlight, index) => {
        const Icon = ICONS[highlight.icon];
        return (
          <section key={highlight.title} aria-label={highlight.title} className={cn("flex flex-col gap-2 rounded-xl p-5", TINTS[index % TINTS.length])}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="m-0 text-field-label text-ink-body">{highlight.title}</h2>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-ink">
                <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>
            <span className="truncate text-hero-number text-ink">{highlight.value}</span>
            <span className="text-body text-ink-body">{highlight.caption}</span>
          </section>
        );
      })}
    </div>
  );
}
