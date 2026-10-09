import { LogOut } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { IconButton } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { colors, space } from "@/lib/theme";
import { Logo } from "./logo";

export function RangerHeader() {
  const logout = useLogout();
  return (
    <View style={styles.header}>
      <Logo />
      <View style={styles.actions}>
        <NotificationsButton />
        <IconButton icon={LogOut} accessibilityLabel="Log out" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: space[3] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
});
