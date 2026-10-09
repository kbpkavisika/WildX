import { router, usePathname, type Href } from "expo-router";
import { Bell, ClipboardList, Route, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/text";
import { colors, fonts, ICON_STROKE, radii, sizes } from "@/lib/theme";

interface RangerNavItem {
  label: string;
  href: Href;
  icon: LucideIcon;
}

const RANGER_NAV_ITEMS: RangerNavItem[] = [
  { label: "Patrols", href: "/", icon: Route },
  { label: "Report", href: "/report", icon: TriangleAlert },
  { label: "Tasks", href: "/tasks", icon: ClipboardList },
  { label: "Alerts", href: "/alerts", icon: Bell },
];

const TAB_MARGIN = 6;

export function RangerNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View accessibilityRole="tablist" style={[styles.nav, { paddingBottom: insets.bottom }]}>
      {RANGER_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(item.href)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Icon size={sizes.icon} color={active ? colors.ink : colors.inkBody} strokeWidth={ICON_STROKE} />
            <AppText variant="caption" color={active ? colors.ink : colors.inkBody} style={active && styles.labelActive}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  tab: {
    flex: 1,
    minHeight: sizes.tap,
    margin: TAB_MARGIN,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabActive: { backgroundColor: colors.secondary },
  labelActive: { fontFamily: fonts.medium },
});
