import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, SecondaryButton } from "@/components/ui/button";
import { FormPanel } from "@/components/ui/form-panel";
import { Notice } from "@/components/ui/notice";
import { AppText } from "@/components/ui/text";
import type { useRangerPatrol } from "@/hooks/use-ranger-patrol";
import type { RangerPatrolView } from "@/lib/patrols/mappers";
import { useRangerPatrolPage } from "@/lib/patrols/store";
import { space } from "@/lib/theme";
import { WaypointForm } from "./waypoint-form";

type RangerPatrol = ReturnType<typeof useRangerPatrol>;

interface RangerPatrolActionsProps {
  view: RangerPatrolView;
  patrol: Pick<RangerPatrol, "position" | "sectors" | "start" | "end" | "addWaypoint" | "cancelPanel">;
}

export function RangerPatrolActions({ view, patrol }: RangerPatrolActionsProps) {
  const { panel, notice, error, setPanel } = useRangerPatrolPage();

  if (view.completedAt) {
    return (
      <View style={styles.stack}>
        {notice && <Notice tone="positive">{notice}</Notice>}
        <Notice tone="positive">Patrol completed at {view.completedAt}.</Notice>
      </View>
    );
  }

  if (view.isActive && panel === "waypoint") {
    return <WaypointForm gpsPosition={patrol.position} sectors={patrol.sectors} onSubmit={patrol.addWaypoint} onCancel={patrol.cancelPanel} />;
  }

  if (view.isActive && panel === "end") {
    return (
      <FormPanel>
        <AppText variant="label">End this patrol now?</AppText>
        <Button label="End patrol" onPress={patrol.end} />
        <SecondaryButton label="Keep going" onPress={patrol.cancelPanel} />
        {error && <Notice tone="negative">{error}</Notice>}
      </FormPanel>
    );
  }

  return (
    <View style={styles.stack}>
      {notice && <Notice tone="positive">{notice}</Notice>}
      {view.canStart && <Button label="Start patrol" onPress={patrol.start} />}
      {view.isActive && (
        <>
          <Button label="Add waypoint" onPress={() => setPanel("waypoint")} />
          <SecondaryButton label="Report incident" onPress={() => router.navigate("/report")} />
          <SecondaryButton label="End patrol" onPress={() => setPanel("end")} />
        </>
      )}
      {error && <Notice tone="negative">{error}</Notice>}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[3] },
});
