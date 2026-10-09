"use client";

import { DevicesTable } from "@/components/devices/devices-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { useDevices } from "@/hooks/use-devices";
import { useDevicesPage } from "@/lib/devices/store";
import type { DevicesView } from "@/lib/devices/types";

function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

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
  const { parkId, isPending, isError, view } = useDevices();
  const { filter, setFilter } = useDevicesPage();

  return (
    <>
      <PageHeader title="Devices" subtitle={view && <Summary view={view} />} />
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
