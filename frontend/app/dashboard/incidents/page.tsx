"use client";

import { Download } from "lucide-react";
import { useRef } from "react";
import { IncidentDetail } from "@/components/incidents/incident-detail";
import { IncidentFilters } from "@/components/incidents/incident-filters";
import { IncidentsTable } from "@/components/incidents/incidents-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useIncidentQueueView } from "@/hooks/use-incident-queue";
import { useIncidentReportCsv } from "@/hooks/use-incident-report";
import { apiErrorMessage } from "@/lib/api/client";
import { useIncidentQueue } from "@/lib/incidents/store";

const DETAIL_COLUMN = "flex min-w-0 flex-[2_1_340px] flex-col";

export default function IncidentsPage() {
  const { allowed, isPending, isError, types, view } = useIncidentQueueView();
  const { filters, selectedId, setFilter, select } = useIncidentQueue();
  const csv = useIncidentReportCsv();
  const detailRef = useRef<HTMLDivElement>(null);

  const selectIncident = (id: number) => {
    select(id);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle={
          view && (
            <>
              <strong className="font-semibold text-ink">{view.newCount} new</strong> waiting for triage.
            </>
          )
        }
        action={
          <Button onClick={() => csv.mutate()} disabled={!allowed || csv.isPending} className="disabled:opacity-60">
            <Download className="size-[18px]" strokeWidth={2} />
            {csv.isPending ? "Preparing…" : "Download CSV"}
          </Button>
        }
      />
      {csv.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(csv.error)}</p>}
      {!allowed && <p className="text-body text-ink-muted">The incident queue is available to park managers.</p>}
      {isPending && <p className="text-body text-ink-muted">Loading incidents…</p>}
      {isError && <p className="text-body text-negative">Could not load incidents. Retrying.</p>}
      {view && (
        <div className="flex flex-wrap items-start gap-5">
          <Card label="Incident queue" className="flex-[3_1_420px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {view.statusOptions.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    pressed={filters.status === option.value}
                    onClick={() => setFilter({ status: option.value })}
                  />
                ))}
              </div>
              <IncidentFilters filters={filters} types={types} onChange={setFilter} />
            </div>
            <IncidentsTable rows={view.rows} selectedId={selectedId} onSelect={selectIncident} />
          </Card>
          <div ref={detailRef} className={DETAIL_COLUMN}>
            {selectedId === null ? (
              <Card label="Incident detail">
                <p className="m-0 text-body text-ink-muted">Select an incident to triage it.</p>
              </Card>
            ) : (
              <IncidentDetail key={selectedId} id={selectedId} onClose={() => select(null)} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
