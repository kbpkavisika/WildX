"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CoverageReportTable } from "@/components/patrols/coverage-report-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { useCoverageReport } from "@/hooks/use-coverage-report";
import { apiErrorMessage } from "@/lib/api/client";
import type { CoverageReportView } from "@/lib/patrols/types";

function Summary({ view }: { view: CoverageReportView }) {
  if (view.visitedCount === 0) return <>No patrols recorded in this range.</>;
  return (
    <>
      Patrols visited <strong className="font-semibold text-ink">{view.visitedCount} of {view.sectorCount} sectors</strong> in this range.
    </>
  );
}

export default function CoverageReportPage() {
  const { from, to, setRange, rangeError, isPending, isError, view, csv } = useCoverageReport();

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
        <Card label="Coverage by sector">
          <CoverageReportTable rows={view.rows} />
        </Card>
      )}
    </>
  );
}
