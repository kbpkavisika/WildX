"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NoGpsBanner } from "@/components/patrols/no-gps-banner";
import { RangerPatrolActions } from "@/components/patrols/ranger-patrol-actions";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { useRangerPatrol } from "@/hooks/use-ranger-patrol";

const RangerPatrolMap = dynamic(() => import("@/components/patrols/ranger-patrol-map"), { ssr: false });

export default function RangerPatrolPage() {
  const id = Number(useParams<{ id: string }>().id);
  const patrol = useRangerPatrol(id);
  const { isPending, isError, notFound, view, sectors, fix, gpsLost } = patrol;

  return (
    <>
      <Link href="/ranger" className="inline-flex min-h-12 items-center gap-1.5 self-start text-field-label text-ink-body">
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Patrols
      </Link>
      {isPending && <p className="m-0 text-body text-ink-muted">Loading patrol…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load this patrol. Retrying.</p>}
      {notFound && <p className="m-0 text-body text-ink-muted">This patrol is not assigned to you today.</p>}
      {view && (
        <>
          <PageHeader title={view.title} badge={<Chip tone={view.status.tone}>{view.status.label}</Chip>} subtitle={view.subtitle} />
          {gpsLost && <NoGpsBanner />}
          <RangerPatrolMap route={view.route} track={view.track} waypoints={view.waypoints} position={fix?.position ?? null} sectors={sectors} />
          <FactList facts={view.facts} />
          <RangerPatrolActions view={view} patrol={patrol} />
        </>
      )}
    </>
  );
}
