import { Bell } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/button";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { useNotifications } from "@/hooks/use-notifications";
import { colors, sizes, space } from "@/lib/theme";
import { NotificationsCard } from "./notifications-card";

const BADGE_OFFSET = -8;
const PANEL_MAX_HEIGHT = "70%";
const HEADER_HEIGHT = sizes.control + space[3] * 2;

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const unreadCount = useNotifications().unreadCount;
  const close = () => setOpen(false);

  return (
    <View>
      <IconButton icon={Bell} accessibilityLabel="Notifications" onPress={() => setOpen(true)} />
      <View pointerEvents="none" style={styles.badge}>
        <UnreadBadge count={unreadCount} />
      </View>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        <View style={[styles.backdrop, { paddingTop: insets.top + HEADER_HEIGHT + space[2] }]}>
          <Pressable accessibilityLabel="Close notifications" style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.panel}>
            <NotificationsCard onClose={close} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", top: BADGE_OFFSET, right: BADGE_OFFSET },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, paddingHorizontal: space[4] },
  panel: { maxHeight: PANEL_MAX_HEIGHT },
});
