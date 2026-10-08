"use client";

import { Plus } from "lucide-react";
import { IncidentTypeForm } from "@/components/incidents/incident-type-form";
import { IncidentTypesTable } from "@/components/incidents/incident-types-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useIncidentTypes } from "@/hooks/use-incident-types";
import { EMPTY_INCIDENT_TYPE, incidentTypeErrorMessage, toIncidentTypeValues } from "@/lib/incidents/incident-type-form";
import { useIncidentTypesPage } from "@/lib/incidents/store";
import type { IncidentTypeRow } from "@/lib/incidents/types";

export default function IncidentTypesPage() {
  const { hasPark, canManage, isPending, isError, types, view, save, remove } = useIncidentTypes();
  const { formOpen, editingId, openNew, openEdit, close } = useIncidentTypesPage();
  const editing = types.find((type) => type.id === editingId) ?? null;

  const openForm = (id: number | null) => {
    save.reset();
    if (id === null) openNew();
    else openEdit(id);
  };

  const confirmDelete = (row: IncidentTypeRow) => {
    if (window.confirm(`Delete ${row.name}? Rangers will no longer see it.`)) remove.mutate(row.id);
  };

  return (
    <>
      <PageHeader
        title="Incident types"
        subtitle={view && `${view.activeCount} active · ${view.inactiveCount} inactive`}
        action={
          canManage && (
            <Button onClick={() => openForm(null)} aria-expanded={formOpen && editingId === null}>
              <Plus className="size-[18px]" strokeWidth={2} />
              New type
            </Button>
          )
        }
      />
      {formOpen && canManage && (
        <IncidentTypeForm
          key={editingId ?? "new"}
          title={editing ? `Edit ${editing.name}` : "New incident type"}
          submitLabel={editing ? "Save changes" : "Create type"}
          defaultValues={editing ? toIncidentTypeValues(editing) : EMPTY_INCIDENT_TYPE}
          saving={save.isPending}
          error={save.error}
          onSubmit={(values) => save.mutate({ typeId: editingId, values }, { onSuccess: close })}
          onClose={close}
        />
      )}
      {!hasPark && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {hasPark && isPending && <p className="text-body text-ink-muted">Loading incident types…</p>}
      {isError && <p className="text-body text-negative">Could not load incident types.</p>}
      {remove.isError && <p role="alert" className="text-body text-negative">{incidentTypeErrorMessage(remove.error)}</p>}
      {view && (
        <Card label="Incident types">
          <IncidentTypesTable
            rows={view.rows}
            canManage={canManage}
            deletingId={remove.isPending ? (remove.variables ?? null) : null}
            onEdit={(id) => openForm(id)}
            onDelete={confirmDelete}
          />
        </Card>
      )}
    </>
  );
}
