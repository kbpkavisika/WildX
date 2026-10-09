import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { colors, ICON_STROKE, radii, sizes, space } from "@/lib/theme";
import { AppText } from "./text";

const NOTICE_COLORS = { positive: colors.positive, negative: colors.negative, muted: colors.inkMuted } as const;

interface NoticeProps {
  tone: keyof typeof NOTICE_COLORS;
  children: React.ReactNode;
}

export function Notice({ tone, children }: NoticeProps) {
  return (
    <AppText color={NOTICE_COLORS[tone]} accessibilityRole={tone === "negative" ? "alert" : "text"} accessibilityLiveRegion="polite">
      {children}
    </AppText>
  );
}

interface BannerProps {
  icon?: LucideIcon;
  title: string;
  caption: string;
  children?: React.ReactNode;
}

export function NegativeBanner({ icon: Icon, title, caption, children }: BannerProps) {
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <View style={styles.row}>
        {Icon && <Icon size={sizes.icon} color={colors.negative} strokeWidth={ICON_STROKE} style={styles.icon} />}
        <View style={styles.text}>
          <AppText variant="label" color={colors.negative}>{title}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{caption}</AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: space[3],
    borderWidth: 1,
    borderColor: colors.negativeLine,
    backgroundColor: colors.negativeBg,
    borderRadius: radii.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  row: { flexDirection: "row", gap: space[3] },
  icon: { marginTop: 2 },
  text: { flex: 1, gap: 2 },
});
