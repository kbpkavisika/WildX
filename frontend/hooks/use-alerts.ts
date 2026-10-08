import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "@/lib/api/alerts";
import { fetchZones } from "@/lib/api/zones";
import { toAlertsView } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import { useAuthStore } from "@/lib/auth/store";
import { ALERTS_REFETCH_MS } from "@/lib/constants";

export function useAlerts() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const filter = useAlertsPage((state) => state.filter);
  const enabled = signedIn && parkId !== null;

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: ALERTS_REFETCH_MS,
    enabled,
  });

  const zones = useQuery({
    queryKey: ["parks", parkId, "zones"],
    queryFn: () => fetchZones(parkId as number),
    enabled,
  });

  return {
    signedIn,
    hasPark: parkId !== null,
    isPending: alerts.isPending,
    isError: alerts.isError,
    view: alerts.data && toAlertsView(alerts.data, zones.data ?? [], filter, new Date()),
  };
}
