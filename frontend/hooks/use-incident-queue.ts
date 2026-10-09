import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "@/lib/api/incidents";
import { canViewIncidents } from "@/lib/auth/routes";
import { useAuthStore } from "@/lib/auth/store";
import { INCIDENTS_REFETCH_MS } from "@/lib/constants";
import { toIncidentQueueView } from "@/lib/incidents/mappers";
import { useIncidentQueue } from "@/lib/incidents/store";
import { useParkIncidentTypes } from "./use-incident-types";

export function useIncidentQueueView() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const allowed = useAuthStore((state) => canViewIncidents(state.user?.role));
  const filters = useIncidentQueue((state) => state.filters);
  const types = useParkIncidentTypes();

  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: INCIDENTS_REFETCH_MS,
    enabled: signedIn && allowed,
  });

  return {
    allowed,
    isPending: allowed && incidents.isPending,
    isError: incidents.isError,
    types: types.data ?? [],
    view: incidents.data && toIncidentQueueView(incidents.data, filters, new Date()),
  };
}
