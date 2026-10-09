import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "@/lib/api/alerts";
import { ALERTS_REFETCH_MS } from "@/lib/constants";
import { ALERT_STATUSES } from "@/lib/enums";

export function useOpenAlertCount(enabled: boolean): number {
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: ALERTS_REFETCH_MS,
    enabled,
    select: (data) => data.filter((alert) => alert.status === ALERT_STATUSES.OPEN).length,
  });
  return alerts.data ?? 0;
}
