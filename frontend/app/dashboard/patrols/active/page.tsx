"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/page-header";
import { LiveChip } from "@/components/ui/live-chip";
import { useActivePatrols } from "@/hooks/use-active-patrols";
import { GPS_INTERVAL_S } from "@/lib/constants";
import { EMPTY_ACTIVE_PATROLS } from "@/lib/patrols/mappers";
import type { ActivePatrolsView } from "@/lib/patrols/types";

const LiveMap = dynamic(() => import("@/components/patrols/live-map"), { ssr: false });

function teamsLabel(count: number): string {
  return count === 1 ? "1 team" : `${count} teams`;
}

function Summary({ view }: { view: ActivePatrolsView }) {
  return (
    <>
      <strong className="font-semibold text-ink">{teamsLabel(view.patrols.length)}</strong> in the field. Positions update every {GPS_INTERVAL_S} s
      {view.lastUpdate ? `, last at ${view.lastUpdate}.` : "."}
    </>
  );
}

export default function ActivePatrolsPage() {
  const { signedIn, isPending, isError, view } = useActivePatrols();

  function subtitle() {
    if (!signedIn) return "Sign in to see live patrols.";
    if (isError) return <span className="text-negative">Could not load live patrols. Retrying.</span>;
    if (isPending || !view) return "Loading live patrols…";
    return <Summary view={view} />;
  }

  return (
    <>
      <PageHeader title="Active patrols" badge={<LiveChip />} subtitle={subtitle()} />
      <LiveMap view={view ?? EMPTY_ACTIVE_PATROLS} />
    </>
  );
}
