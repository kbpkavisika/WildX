"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { SecondaryLink } from "@/components/devices/secondary-link";
import { PageHeader } from "@/components/layout/page-header";
import { WaypointList } from "@/components/patrols/waypoint-list";
import { Card, CardTitle } from "@/components/ui/card";
import { MetricRow } from "@/components/ui/metric-row";
import { useParkSectors } from "@/hooks/use-park-sectors";
import { usePatrolReplay } from "@/hooks/use-patrol-replay";

const ReplayMap = dynamic(() => import("@/components/patrols/replay-map"), { ssr: false });

export default function PatrolReplayPage() {
  const id = Number(useParams<{ id: string }>().id);
  const { isPending, isError, notFound, view, scrub } = usePatrolReplay(id);
  const sectors = useParkSectors();
  const scrubIndex = view ? view.walked.length - 1 : 0;

  return (
    <>
      <PageHeader
        title={view?.title ?? "Patrol replay"}
        subtitle={view?.subtitle}
        action={<SecondaryLink href="/dashboard/patrols">All patrols</SecondaryLink>}
      />
      {isPending && !notFound && <p className="m-0 text-body text-ink-muted">Loading patrol…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load this patrol.</p>}
      {notFound && <p className="m-0 text-body text-ink-muted">This patrol does not exist in your park.</p>}
      {view && (
        <>
          <Card label="Patrol facts">
            <MetricRow metrics={view.metrics} />
          </Card>
          <Card label="Track">
            {view.track.length === 0 ? (
              <p className="m-0 text-body text-ink-muted">No track recorded for this patrol.</p>
            ) : (
              <>
                <ReplayMap track={view.track} walked={view.walked} position={view.position} waypoints={view.waypoints} sectors={sectors} />
                <div className="flex flex-col gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={view.maxIndex}
                    value={scrubIndex}
                    onChange={(event) => scrub(Number(event.target.value))}
                    aria-label="Scrub through the track"
                    aria-valuetext={view.scrubTime}
                    className="h-12 w-full cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-caption text-ink-muted">
                    <span>{view.scrubTime}</span>
                    <span>{view.endTime}</span>
                  </div>
                </div>
              </>
            )}
          </Card>
          <Card label="Waypoints">
            <CardTitle>Waypoints</CardTitle>
            <WaypointList waypoints={view.waypoints} />
          </Card>
        </>
      )}
    </>
  );
}
