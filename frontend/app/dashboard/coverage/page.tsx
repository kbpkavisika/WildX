"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/page-header";
import { useCoverage } from "@/hooks/use-coverage";
import { counted } from "@/lib/devices/mappers";
import type { CoverageView } from "@/lib/patrols/types";

const CoverageMap = dynamic(() => import("@/components/patrols/coverage-map"), { ssr: false });

const EMPTY_COVERAGE: CoverageView = { sectors: [], neglectedCount: 0 };

function Summary({ view }: { view: CoverageView }) {
  if (view.neglectedCount === 0) return <>Every sector patrolled recently.</>;
  return (
    <>
      <strong className="font-semibold text-ink">{counted(view.neglectedCount, "sector", "sectors")}</strong> not patrolled recently.
    </>
  );
}

export default function CoveragePage() {
  const { signedIn, isPending, isError, view } = useCoverage();

  function subtitle() {
    if (!signedIn) return "Sign in to see patrol coverage.";
    if (isError) return <span className="text-negative">Could not load coverage. Retrying.</span>;
    if (isPending || !view) return "Loading coverage…";
    return <Summary view={view} />;
  }

  return (
    <>
      <PageHeader title="Coverage" subtitle={subtitle()} />
      <CoverageMap view={view ?? EMPTY_COVERAGE} />
    </>
  );
}
