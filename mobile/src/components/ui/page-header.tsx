import { StyleSheet, View } from "react-native";
import { colors, fonts, space } from "@/lib/theme";
import { AppText } from "./text";

interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function PageHeader({ title, badge, subtitle }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <AppText variant="pageTitle" accessibilityRole="header" style={styles.title}>{title}</AppText>
        {badge}
      </View>
      {subtitle && <AppText variant="nav" color={colors.inkBody}>{subtitle}</AppText>}
    </View>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <AppText variant="nav" style={styles.strong}>{children}</AppText>;
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space[3] },
  title: { flexShrink: 1 },
  strong: { fontFamily: fonts.semibold, color: colors.ink },
});
