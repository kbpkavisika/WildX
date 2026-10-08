import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyNotifications, markNotificationRead } from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/auth/store";
import { NOTIFICATIONS_REFETCH_MS } from "@/lib/constants";
import { ROLES } from "@/lib/enums";
import { toNotificationsView } from "@/lib/notifications/mappers";

export function useNotifications() {
  const queryClient = useQueryClient();
  const canReceive = useAuthStore((state) => state.user !== null && state.user.role !== ROLES.ADMIN);

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchMyNotifications,
    refetchInterval: NOTIFICATIONS_REFETCH_MS,
    enabled: canReceive,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    isPending: notifications.isPending,
    isError: notifications.isError,
    view: notifications.data && toNotificationsView(notifications.data, new Date()),
    markRead,
  };
}
