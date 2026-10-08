"use client";

import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { CountBars } from "@/components/incidents/count-bars";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { useIncidentReport } from "@/hooks/use-incident-report";
import { useParkSectors } from "@/hooks/use-park-sectors";
import { apiErrorMessage } from "@/lib/api/client";

const IncidentPointsMap = dynamic(() => import("@/components/incidents/incident-points-map"), { ssr: false });

export default function IncidentReportPage() {
  const { from, to, setRange, rangeError, isPending, isError, view, csv } = useIncidentReport();
  const sectors = useParkSectors();

  return (
    <>
      <PageHeader
        title="Incident report"
        subtitle={view && <><strong className="font-semibold text-ink">{view.total} incidents</strong> in this range.</>}
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
          <div className="grid gap-5 lg:grid-cols-3">
            <CountBars title="By type" bars={view.byType} />
            <CountBars title="By sector" bars={view.bySector} />
            <CountBars title="By month" bars={view.byMonth} />
          </div>
          <Card label="Incident map">
            <CardTitle>Incident map</CardTitle>
            <IncidentPointsMap points={view.points} sectors={sectors} />
          </Card>
        </>
      )}
    </>
  );
}
