"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewPatrolForm } from "@/components/patrols/new-patrol-form";
import { PatrolsTable } from "@/components/patrols/patrols-table";
import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useAllPatrols } from "@/hooks/use-all-patrols";
import { usePatrolsPage } from "@/lib/patrols/store";

export default function AllPatrolsPage() {
  const { signedIn, isPending, isError, view } = useAllPatrols();
  const { filter, setFilter, formOpen, setFormOpen } = usePatrolsPage();

  return (
    <>
      <PageHeader
        title="All patrols"
        subtitle={
          view && (
            <>
              <strong className="font-semibold text-ink">{view.scheduledCount} scheduled</strong>, {view.activeCount} in the field right now.
            </>
          )
        }
        action={
          <Can permission="patrol.create">
            <Button onClick={() => setFormOpen(true)} disabled={!signedIn} aria-expanded={formOpen} className="disabled:opacity-60">
              <Plus className="size-[18px]" strokeWidth={2} />
              New patrol
            </Button>
          </Can>
        }
      />
      {formOpen && <NewPatrolForm onClose={() => setFormOpen(false)} />}
      {!signedIn && <p className="text-body text-ink-muted">Sign in to see patrols.</p>}
      {signedIn && isPending && <p className="text-body text-ink-muted">Loading patrols…</p>}
      {isError && <p className="text-body text-negative">Could not load patrols. Retrying.</p>}
      {view && (
        <Card label="All patrols">
          <div className="flex flex-wrap items-center gap-2">
            {view.filters.map((option) => (
              <FilterPill
                key={option.value}
                label={option.label}
                count={option.count}
                pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              />
            ))}
          </div>
          <PatrolsTable rows={view.rows} />
        </Card>
      )}
    </>
  );
}
