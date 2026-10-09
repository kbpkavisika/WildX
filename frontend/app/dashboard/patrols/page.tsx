"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PatrolForm } from "@/components/patrols/patrol-form";
import { PatrolsTable } from "@/components/patrols/patrols-table";
import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useAllPatrols } from "@/hooks/use-all-patrols";
import { useCan } from "@/hooks/use-can";
import { apiErrorMessage } from "@/lib/api/client";
import { usePatrolsPage } from "@/lib/patrols/store";
import type { PatrolRow } from "@/lib/patrols/types";

export default function AllPatrolsPage() {
  const { signedIn, isPending, isError, patrols, view, remove } = useAllPatrols();
  const { filter, setFilter, formOpen, editingId, openNew, openEdit, close } = usePatrolsPage();
  const canManage = useCan("patrol.create");
  const editing = patrols.find((patrol) => patrol.id === editingId) ?? null;

  const openForm = (id: number | null) => {
    remove.reset();
    if (id === null) openNew();
    else openEdit(id);
  };

  const confirmDelete = (row: PatrolRow) => {
    if (window.confirm(`Delete ${row.code} (${row.title}, ${row.leaderName})?`)) remove.mutate(row.id);
  };

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
            <Button onClick={() => openForm(null)} disabled={!signedIn} aria-haspopup="dialog" className="disabled:opacity-60">
              <Plus className="size-[18px]" strokeWidth={2} />
              New patrol
            </Button>
          </Can>
        }
      />
      {formOpen && <PatrolForm key={editingId ?? "new"} patrol={editing} onClose={close} />}
      {!signedIn && <p className="text-body text-ink-muted">Sign in to see patrols.</p>}
      {signedIn && isPending && <p className="text-body text-ink-muted">Loading patrols…</p>}
      {isError && <p className="text-body text-negative">Could not load patrols. Retrying.</p>}
      {remove.isError && <p role="alert" className="text-body text-negative">{apiErrorMessage(remove.error)}</p>}
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
          <PatrolsTable
            rows={view.rows}
            canManage={canManage}
            deletingId={remove.isPending ? (remove.variables ?? null) : null}
            onEdit={openForm}
            onDelete={confirmDelete}
          />
        </Card>
      )}
    </>
  );
}
