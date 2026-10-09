"use client";

import { Plus } from "lucide-react";
import { AnimalForm } from "@/components/devices/animal-form";
import { DeviceForm } from "@/components/devices/device-form";
import { DevicesTable } from "@/components/devices/devices-table";
import { FormPanel } from "@/components/devices/form-panel";
import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useDevices } from "@/hooks/use-devices";
import { counted } from "@/lib/devices/mappers";
import { useDevicesPage } from "@/lib/devices/store";
import type { DevicesView } from "@/lib/devices/types";

function Summary({ view }: { view: DevicesView }) {
  const attention = view.attentionCount === 0 ? "all healthy" : `${view.attentionCount} ${view.attentionCount === 1 ? "needs" : "need"} attention`;
  return (
    <>
      <strong className="font-semibold text-ink">{counted(view.collarCount, "collar", "collars")}</strong> and{" "}
      {counted(view.cameraCount, "camera", "cameras")}, {attention}.
    </>
  );
}

export default function DevicesPage() {
  const { parkId, canManage, isPending, isError, view } = useDevices();
  const { filter, setFilter, form, setForm } = useDevicesPage();
  const close = () => setForm(null);

  return (
    <>
      <PageHeader
        title="Devices"
        subtitle={view && <Summary view={view} />}
        action={
          canManage && (
            <div className="flex flex-wrap items-center gap-3">
              <SecondaryLink href="/dashboard/simulator">Simulator</SecondaryLink>
              <SecondaryButton onClick={() => setForm("animal")} aria-expanded={form === "animal"}>New animal</SecondaryButton>
              <Button onClick={() => setForm("device")} aria-expanded={form === "device"}>
                <Plus className="size-[18px]" strokeWidth={2} />
                New device
              </Button>
            </div>
          )
        }
      />
      {canManage && form === "device" && (
        <FormPanel title="New device" onClose={close}>
          <DeviceForm onClose={close} />
        </FormPanel>
      )}
      {canManage && form === "animal" && (
        <FormPanel title="New animal" onClose={close}>
          <AnimalForm onClose={close} />
        </FormPanel>
      )}
      {parkId === null && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {parkId !== null && isPending && <p className="text-body text-ink-muted">Loading devices…</p>}
      {isError && <p className="text-body text-negative">Could not load devices. Retrying.</p>}
      {view && (
        <Card label="Devices">
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
          <DevicesTable rows={view.rows} />
        </Card>
      )}
    </>
  );
}
