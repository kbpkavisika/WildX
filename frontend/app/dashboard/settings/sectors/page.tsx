"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { FormPanel } from "@/components/devices/form-panel";
import { PageHeader } from "@/components/layout/page-header";
import { NeglectForm } from "@/components/parks/neglect-form";
import { SectorForm } from "@/components/parks/sector-form";
import { SectorList } from "@/components/parks/sector-list";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useParks } from "@/hooks/use-parks";
import { useSectors } from "@/hooks/use-sectors";
import type { SectorResponse } from "@/lib/api/parks";
import { apiErrorMessage } from "@/lib/api/client";
import { counted } from "@/lib/devices/mappers";
import { EMPTY_SECTOR, toSectorValues } from "@/lib/parks/forms";

const NEW_SECTOR = "new";

export default function SectorsPage() {
  const { hasPark, canManage, isPending, isError, sectors, save, remove, saveNeglectDays } = useSectors();
  const { current } = useParks();
  const [editing, setEditing] = useState<number | typeof NEW_SECTOR | null>(null);
  const editingSector = sectors.find((sector) => sector.id === editing) ?? null;
  const close = () => setEditing(null);

  const openForm = (id: number | typeof NEW_SECTOR) => {
    save.reset();
    remove.reset();
    setEditing(id);
  };

  const confirmDelete = (sector: SectorResponse) => {
    if (window.confirm(`Delete ${sector.name}?`)) remove.mutate(sector.id);
  };

  return (
    <>
      <PageHeader
        title="Sectors"
        subtitle={!isPending && <><strong className="font-semibold text-ink">{counted(sectors.length, "sector", "sectors")}</strong> used for patrol coverage.</>}
        action={
          canManage && (
            <Button onClick={() => openForm(NEW_SECTOR)} aria-expanded={editing === NEW_SECTOR}>
              <Plus className="size-[18px]" strokeWidth={2} />
              New sector
            </Button>
          )
        }
      />
      {canManage && current && (
        <NeglectForm
          key={current.id}
          neglectDays={current.neglectDays}
          saving={saveNeglectDays.isPending}
          saved={saveNeglectDays.isSuccess}
          error={saveNeglectDays.error}
          onSubmit={(days) => saveNeglectDays.mutate(days)}
        />
      )}
      {editing !== null && canManage && (
        <FormPanel title={editingSector ? `Edit ${editingSector.name}` : "New sector"} onClose={close}>
          <SectorForm
            key={editing}
            defaultValues={editingSector ? toSectorValues(editingSector) : EMPTY_SECTOR}
            submitLabel={editingSector ? "Save changes" : "Create sector"}
            saving={save.isPending}
            error={save.error}
            onSubmit={(values) => save.mutate({ sectorId: editingSector?.id ?? null, values }, { onSuccess: close })}
            onClose={close}
          />
        </FormPanel>
      )}
      {!hasPark && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {hasPark && isPending && <p className="text-body text-ink-muted">Loading sectors…</p>}
      {isError && <p className="text-body text-negative">Could not load sectors.</p>}
      {remove.isError && <p role="alert" className="text-body text-negative">{apiErrorMessage(remove.error)}</p>}
      {!isPending && !isError && (
        <Card label="Sectors">
          <CardTitle>Sectors</CardTitle>
          <SectorList
            sectors={sectors}
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
