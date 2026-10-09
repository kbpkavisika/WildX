"use client";

import { IncidentFilters } from "@/components/incidents/incident-filters";
import { IncidentsTable } from "@/components/incidents/incidents-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useIncidentQueueView } from "@/hooks/use-incident-queue";
import { useIncidentQueue } from "@/lib/incidents/store";

export default function IncidentsPage() {
  const { allowed, isPending, isError, types, view } = useIncidentQueueView();
  const { filters, setFilter } = useIncidentQueue();

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
      />
      {!allowed && <p className="text-body text-ink-muted">The incident queue is available to supervisors and managers.</p>}
      {isPending &&<p className="text-body text-ink-muted">Loading incidents…</p>}
      {isError && <p className="text-body text-negative">Could not load incidents. Retrying.</p>}
      {view && (
        <Card label="Incident queue">
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
          <IncidentsTable rows={view.rows} />
        </Card>
      )}
    </>
  );
}
