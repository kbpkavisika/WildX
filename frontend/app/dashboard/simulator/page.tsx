"use client";

import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { CameraSimulationForm } from "@/components/simulator/camera-simulation-form";
import { CollarSimulationForm } from "@/components/simulator/collar-simulation-form";
import { useSimulator } from "@/hooks/use-simulator";

export default function SimulatorPage() {
  const { parkId, canSimulate, collars, cameras, zones, collar, camera } = useSimulator();

  return (
    <>
      <PageHeader
        title="Simulator"
        subtitle={
          <>
            Send <strong className="font-semibold text-ink">test collar fixes and camera images</strong> through the real ingest. Alerts follow the park rules.
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryLink href="/dashboard/devices">Devices</SecondaryLink>
            <SecondaryLink href="/dashboard/alerts">Alerts</SecondaryLink>
          </div>
        }
      />
      {parkId === null && <p className="text-body text-ink-muted">Your account is not linked to a park.</p>}
      {parkId !== null && !canSimulate && <p className="text-body text-ink-muted">Only park managers can use the simulator.</p>}
      {parkId !== null && canSimulate && (
        <div className="flex flex-wrap items-start gap-5">
          <CollarSimulationForm collars={collars} zones={zones} send={collar} />
          <CameraSimulationForm cameras={cameras} send={camera} />
        </div>
      )}
    </>
  );
}
