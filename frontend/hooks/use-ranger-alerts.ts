import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "@/lib/api/alerts";
import { toRangerAlertsView } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import { useAuthStore } from "@/lib/auth/store";
import { ALERTS_REFETCH_MS } from "@/lib/constants";

export function useRangerAlerts() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const role = useAuthStore((state) => state.user?.role ?? null);
  const selectedId = useAlertsPage((state) => state.selectedId);

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: ALERTS_REFETCH_MS,
    enabled: signedIn,
  });

  return {
    isPending: alerts.isPending,
    isError: alerts.isError,
    view: alerts.data && toRangerAlertsView(alerts.data, selectedId, role, new Date()),
  };
}
