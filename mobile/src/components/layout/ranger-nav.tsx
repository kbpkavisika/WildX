import { router, usePathname, type Href } from "expo-router";
import { Bell, ClipboardList, Route, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/text";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { useNotifications } from "@/hooks/use-notifications";
import { colors, fonts, ICON_STROKE, radii, sizes } from "@/lib/theme";

interface RangerNavItem {
  label: string;
  href: Href;
  icon: LucideIcon;
  showsUnread: boolean;
}

const RANGER_NAV_ITEMS: RangerNavItem[] = [
  { label: "Patrols", href: "/", icon: Route, showsUnread: false },
  { label: "Report", href: "/report", icon: TriangleAlert, showsUnread: false },
  { label: "Tasks", href: "/tasks", icon: ClipboardList, showsUnread: false },
  { label: "Alerts", href: "/alerts", icon: Bell, showsUnread: true },
];

const TAB_MARGIN = 6;
const BADGE_OFFSET = -12;

export function RangerNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const unreadCount = useNotifications().unreadCount;

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
            <View>
              <Icon size={sizes.icon} color={active ? colors.ink : colors.inkBody} strokeWidth={ICON_STROKE} />
              {item.showsUnread && (
                <View style={styles.badge}>
                  <UnreadBadge count={unreadCount} />
                </View>
              )}
            </View>
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
  badge: { position: "absolute", top: BADGE_OFFSET, right: BADGE_OFFSET },
});
