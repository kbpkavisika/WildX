import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { NoGpsBanner } from "@/components/patrols/no-gps-banner";
import { RangerPatrolActions } from "@/components/patrols/ranger-patrol-actions";
import { RangerPatrolMap } from "@/components/patrols/ranger-patrol-map";
import { BackLink } from "@/components/ui/back-link";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { useRangerPatrol } from "@/hooks/use-ranger-patrol";
import { useRangerPatrolPage } from "@/lib/patrols/store";

export default function RangerPatrolScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const patrol = useRangerPatrol(id);
  const { isPending, isError, notFound, view, sectors, position, gpsLost } = patrol;
  const setPanel = useRangerPatrolPage((state) => state.setPanel);

  useEffect(() => {
    setPanel(null);
  }, [id, setPanel]);

  return (
    <Screen>
      <BackLink label="Patrols" href="/" />
      {isPending && <Notice tone="muted">Loading patrol…</Notice>}
      {isError && <Notice tone="negative">Could not load this patrol. Retrying.</Notice>}
      {notFound && <Notice tone="muted">This patrol is not assigned to you today.</Notice>}
      {view && (
        <>
          <PageHeader title={view.title} badge={<Chip chip={view.status} />} subtitle={view.subtitle} />
          {gpsLost && <NoGpsBanner />}
          <RangerPatrolMap route={view.route} track={view.track} waypoints={view.waypoints} position={position} sectors={sectors} />
          <FactList facts={view.facts} />
          <RangerPatrolActions view={view} patrol={patrol} />
        </>
      )}
    </Screen>
  );
}
