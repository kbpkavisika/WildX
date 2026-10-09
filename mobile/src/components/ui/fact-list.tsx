import { StyleSheet, View } from "react-native";
import { colors, space } from "@/lib/theme";
import type { DetailFact } from "@/lib/view-types";
import { AppText } from "./text";

const LABEL_WIDTH = 110;

export function FactList({ facts }: { facts: DetailFact[] }) {
  return (
    <View style={styles.list}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.row}>
          <AppText color={colors.inkMuted} style={styles.label}>{fact.label}</AppText>
          <AppText style={styles.value}>{fact.value}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[3] },
  row: { flexDirection: "row", gap: space[4] },
  label: { width: LABEL_WIDTH },
  value: { flex: 1 },
});
