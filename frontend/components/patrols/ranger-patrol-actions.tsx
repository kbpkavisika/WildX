"use client";

import Link from "next/link";
import { Button, SecondaryButton } from "@/components/ui/button";
import type { useRangerPatrol } from "@/hooks/use-ranger-patrol";
import { apiErrorMessage } from "@/lib/api/client";
import { useRangerPatrolPage } from "@/lib/patrols/store";
import type { RangerPatrolView } from "@/lib/patrols/types";
import { WaypointForm } from "./waypoint-form";

type RangerPatrol = ReturnType<typeof useRangerPatrol>;

const FULL = "h-12 w-full justify-center disabled:opacity-60";
const SECONDARY_LINK = "inline-flex h-12 w-full items-center justify-center rounded-lg border border-line bg-card px-4 text-label text-ink hover:bg-surface-muted";

interface RangerPatrolActionsProps {
  view: RangerPatrolView;
  patrol: Pick<RangerPatrol, "fix" | "sectors" | "start" | "end" | "waypoint">;
}

function actionError({ start, end }: RangerPatrolActionsProps["patrol"]): Error | null {
  return start.error ?? end.error;
}

export function RangerPatrolActions({ view, patrol }: RangerPatrolActionsProps) {
  const { panel, notice, setPanel } = useRangerPatrolPage();
  const { fix, sectors, start, end, waypoint } = patrol;
  const error = actionError(patrol);

  if (view.completedAt) {
    return <p role="status" className="m-0 text-body text-positive">Patrol completed at {view.completedAt}.</p>;
  }

  if (view.isActive && panel === "waypoint") {
    return (
      <WaypointForm
        gpsPosition={fix?.position ?? null}
        sectors={sectors}
        saving={waypoint.isPending}
        error={waypoint.error}
        onSubmit={(values) => waypoint.mutate({ values, at: fix })}
        onCancel={() => setPanel(null)}
      />
    );
  }

  if (view.isActive && panel === "end") {
    return (
      <div className="flex flex-col gap-3 rounded-[14px] bg-surface-form p-4">
        <p className="m-0 text-label text-ink">End this patrol now?</p>
        <Button onClick={() => end.mutate(undefined, { onSuccess: () => setPanel(null) })} disabled={end.isPending} className={FULL}>
          {end.isPending ? "Ending…" : "End patrol"}
        </Button>
        <SecondaryButton onClick={() => setPanel(null)} className={FULL}>Keep going</SecondaryButton>
        {end.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(end.error)}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notice && <p role="status" className="m-0 text-body text-positive">{notice}</p>}
      {view.canStart && (
        <Button onClick={() => start.mutate()} disabled={start.isPending} className={FULL}>
          {start.isPending ? "Starting…" : "Start patrol"}
        </Button>
      )}
      {view.isActive && (
        <>
          <Button onClick={() => setPanel("waypoint")} className={FULL}>Add waypoint</Button>
          <Link href="/ranger/incident/new" className={SECONDARY_LINK}>Report incident</Link>
          <SecondaryButton onClick={() => setPanel("end")} className={FULL}>End patrol</SecondaryButton>
        </>
      )}
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
    </div>
  );
}
