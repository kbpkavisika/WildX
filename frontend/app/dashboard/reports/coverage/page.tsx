"use client";

import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { RankedBars } from "@/components/reports/ranked-bars";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsGrid } from "@/components/reports/analytics-grid";
import { ShareList } from "@/components/reports/share-list";
import { TrendChart } from "@/components/reports/trend-chart";
import { CoverageReportTable } from "@/components/patrols/coverage-report-table";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { useCoverageReport } from "@/hooks/use-coverage-report";
import { useParkSectors } from "@/hooks/use-park-sectors";
import { apiErrorMessage } from "@/lib/api/client";
import { NO_PATROLS } from "@/lib/patrols/coverage-mappers";
import type { CoverageReportView } from "@/lib/patrols/types";

const CoverageReportMap = dynamic(() => import("@/components/patrols/coverage-report-map"), { ssr: false });

function Summary({ view }: { view: CoverageReportView }) {
  if (view.visitedCount === 0) return <>{NO_PATROLS}</>;
  return (
    <>
      Patrols visited <strong className="font-semibold text-ink">{view.visitedCount} of {view.sectorCount} sectors</strong> in this range.
    </>
  );
}

export default function CoverageReportPage() {
  const { from, to, setRange, rangeError, isPending, isError, view, days, csv } = useCoverageReport();
  const sectors = useParkSectors();

  return (
    <>
      <PageHeader
        title="Patrol coverage report"
        subtitle={view && <Summary view={view} />}
        action={
          <Button onClick={() => csv.mutate()} disabled={rangeError !== null || csv.isPending} className="disabled:opacity-60">
            <Download className="size-[18px]" strokeWidth={2} />
            {csv.isPending ? "Preparing…" : "Download CSV"}
          </Button>
        }
      />
      <div className="grid max-w-[480px] gap-4 sm:grid-cols-2">
        <Field label="From">
          <input type="date" value={from} max={to} onChange={(event) => setRange({ from: event.target.value })} className={fieldClass(rangeError !== null)} />
        </Field>
        <Field label="To">
          <input type="date" value={to} min={from} onChange={(event) => setRange({ to: event.target.value })} className={fieldClass(rangeError !== null)} />
        </Field>
      </div>
      {rangeError && <p role="alert" className="m-0 text-caption text-negative">{rangeError}</p>}
      {csv.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(csv.error)}</p>}
      {isPending && <p className="m-0 text-body text-ink-muted">Loading report…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load the report.</p>}
      {view && (
        <>
          <AnalyticsGrid
            trend={<TrendChart title="Track points recorded" empty={NO_PATROLS} days={days} />}
            highlights={view.highlights}
          >
            <RankedBars title="Patrols by sector" bars={view.byPatrols} empty={NO_PATROLS} />
            <ShareList title="Share of track points" rows={view.pointShares} empty={NO_PATROLS} />
          </AnalyticsGrid>
          <Card label="Coverage map">
            <CardTitle>Coverage map</CardTitle>
            <CoverageReportMap rows={view.rows} sectors={sectors} />
          </Card>
          <Card label="Coverage by sector">
            <CoverageReportTable rows={view.rows} />
          </Card>
        </>
      )}
    </>
  );
}
