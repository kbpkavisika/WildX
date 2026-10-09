import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { FactList } from "@/components/ui/fact-list";
import { Notice } from "@/components/ui/notice";
import { colors, radii, space } from "@/lib/theme";
import type { DetailFact } from "@/lib/view-types";

const PHOTO_HEIGHT = 320;

interface IncidentFactsProps {
  facts: DetailFact[];
  photoSource: { uri: string; headers: Record<string, string> } | null;
}

export function IncidentFacts({ facts, photoSource }: IncidentFactsProps) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.block}>
      <FactList facts={facts} />
      {!photoSource && <Notice tone="muted">No photo attached.</Notice>}
      {photoSource && failed && <Notice tone="negative">Could not load the photo.</Notice>}
      {photoSource && !failed && (
        <Image source={photoSource} accessibilityLabel="Incident photo" resizeMode="contain" style={styles.photo} onError={() => setFailed(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 18 },
  photo: {
    width: "100%",
    height: PHOTO_HEIGHT,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    marginTop: space[1],
  },
});
