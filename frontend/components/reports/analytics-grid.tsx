import { HighlightCards } from "@/components/reports/highlight-cards";
import type { Highlight } from "@/lib/reports/types";

interface AnalyticsGridProps {
  trend: React.ReactNode;
  highlights: Highlight[];
  children: React.ReactNode;
}

export function AnalyticsGrid({ trend, highlights, children }: AnalyticsGridProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {trend}
        <div className="grid gap-5 sm:grid-cols-2">{children}</div>
      </div>
      <HighlightCards highlights={highlights} />
    </div>
  );
}
