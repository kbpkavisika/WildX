"use client";

import { Download } from "lucide-react";
import { AlertReportSummary } from "@/components/alerts/alert-report-summary";
import { AlertReportTable } from "@/components/alerts/alert-report-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { useAlertReport } from "@/hooks/use-alert-report";
import { apiErrorMessage } from "@/lib/api/client";
import { counted } from "@/lib/devices/mappers";

export default function AlertReportPage() {
  const { canView, from, to, setRange, rangeError, isPending, isError, view, csv } = useAlertReport();

  if (!canView) {
    return (
      <>
        <PageHeader title="Alert report" />
        <p className="m-0 text-body text-ink-muted">Only park managers and researchers can see the alert report.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Alert report"
        subtitle={view && <><strong className="font-semibold text-ink">{counted(view.total, "alert", "alerts")}</strong> raised in this range.</>}
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
          <AlertReportSummary metrics={view.metrics} />
          <Card label="By type and zone">
            <CardTitle>By type and zone</CardTitle>
            <AlertReportTable rows={view.rows} />
          </Card>
        </>
      )}
    </>
  );
}
