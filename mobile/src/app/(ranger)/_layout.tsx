import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RangerHeader } from "@/components/layout/ranger-header";
import { RangerNav } from "@/components/layout/ranger-nav";
import { useOfflineReportSync } from "@/hooks/use-offline-report-sync";
import { usePatrolTracking } from "@/hooks/use-patrol-tracking";
import { colors } from "@/lib/theme";

export default function RangerLayout() {
  usePatrolTracking();
  useOfflineReportSync();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingTop: insets.top }]}>
      <RangerHeader />
      <View style={styles.main}>
        <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: colors.surface } }} />
      </View>
      <RangerNav />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.surface },
  main: { flex: 1 },
});
