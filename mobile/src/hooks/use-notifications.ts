import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyNotifications, markNotificationRead } from "@/lib/api/alerts";
import { toNotificationRows } from "@/lib/alerts/mappers";
import { NOTIFICATIONS_REFETCH_MS } from "@/lib/constants";

const NOTIFICATIONS_KEY = ["notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: fetchMyNotifications, refetchInterval: NOTIFICATIONS_REFETCH_MS });

  const markRead = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  return {
    isPending: notifications.isPending,
    isError: notifications.isError,
    rows: notifications.data && toNotificationRows(notifications.data, new Date()),
    unreadCount: notifications.data?.unreadCount ?? 0,
    markRead,
  };
}
