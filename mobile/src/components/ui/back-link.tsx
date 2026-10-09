import { router, type Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { colors, ICON_STROKE, sizes } from "@/lib/theme";
import { AppText } from "./text";

const ARROW_SIZE = 16;

export function BackLink({ label, href }: { label: string; href: Href }) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(href));
  return (
    <Pressable accessibilityRole="link" onPress={goBack} style={styles.link}>
      <ArrowLeft size={ARROW_SIZE} color={colors.inkBody} strokeWidth={ICON_STROKE} />
      <AppText variant="fieldLabel" color={colors.inkBody}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: sizes.tap, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
});
