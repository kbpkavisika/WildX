"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { FormPanel } from "@/components/devices/form-panel";
import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { RulesCard } from "@/components/zones/rules-card";
import { ZoneForm } from "@/components/zones/zone-form";
import { ZoneList } from "@/components/zones/zone-list";
import { useZones } from "@/hooks/use-zones";
import { counted } from "@/lib/devices/mappers";
import { zoneDeleteError } from "@/lib/zones/mappers";
import { useZonesPage } from "@/lib/zones/store";
import type { ZoneRow, ZonesView } from "@/lib/zones/types";
import { EMPTY_ZONE, toZoneValues } from "@/lib/zones/zone-form";

const ZoneMap = dynamic(() => import("@/components/zones/zone-map"), { ssr: false });

function Summary({ view }: { view: ZonesView }) {
  return (
    <>
      <strong className="font-semibold text-ink">{counted(view.zoneCount, "zone", "zones")}</strong>, {view.ruleCount} of {view.typeCount} zone
      types raise alerts.
    </>
  );
}

export default function ZonesPage() {
  const { hasPark, canManage, isPending, isError, zones, rules, view, save, remove } = useZones();
  const { formOpen, editingId, openNew, openEdit, close } = useZonesPage();
  const editing = zones.find((zone) => zone.id === editingId) ?? null;
  const deleting = zones.find((zone) => zone.id === remove.variables) ?? null;

  const openForm = (id: number | null) => {
    save.reset();
    remove.reset();
    if (id === null) openNew();
    else openEdit(id);
  };

  const confirmDelete = (row: ZoneRow) => {
    if (window.confirm(`Delete ${row.name}? Collars inside it will no longer raise alerts.`)) remove.mutate(row.id);
  };

  return (
    <>
      <PageHeader
        title="Zones and rules"
        subtitle={view && <Summary view={view} />}
        action={
          canManage && (
            <div className="flex flex-wrap items-center gap-3">
              <SecondaryLink href="/dashboard/alerts">Alerts</SecondaryLink>
              <Button onClick={() => openForm(null)} aria-expanded={formOpen && editingId === null}>
                <Plus className="size-[18px]" strokeWidth={2} />
                New zone
              </Button>
            </div>
          )
        }
      />
      {formOpen && canManage && (
        <FormPanel title={editing ? `Edit ${editing.name}` : "New zone"} onClose={close}>
          <ZoneForm
            key={editingId ?? "new"}
            defaultValues={editing ? toZoneValues(editing) : EMPTY_ZONE}
            submitLabel={editing ? "Save changes" : "Create zone"}
            saving={save.isPending}
            error={save.error}
            onSubmit={(values) => save.mutate({ zoneId: editingId, values }, { onSuccess: close })}
            onClose={close}
          />
        </FormPanel>
      )}
      {!hasPark && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {hasPark && isPending && <p className="text-body text-ink-muted">Loading zones…</p>}
      {isError && <p className="text-body text-negative">Could not load zones.</p>}
      {remove.isError && (
        <p role="alert" className="text-body text-negative">{zoneDeleteError(remove.error, deleting?.name ?? "This zone")}</p>
      )}
      {view && (
        <>
          <ZoneMap rows={view.rows} />
          <div className="flex flex-wrap items-start gap-5">
            <Card label="Zones" className="flex-[3_1_420px]">
              <CardTitle>Zones</CardTitle>
              <ZoneList
                rows={view.rows}
                canManage={canManage}
                deletingId={remove.isPending ? (remove.variables ?? null) : null}
                onEdit={(id) => openForm(id)}
                onDelete={confirmDelete}
              />
            </Card>
            <RulesCard rows={view.rules} rules={rules} canManage={canManage} />
          </div>
        </>
      )}
    </>
  );
}
