import { useQuery } from "@tanstack/react-query";
import { fetchMyDispatches } from "@/lib/api/dispatches";
import { fetchMyIncidents } from "@/lib/api/incidents";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toDispatchRows, toMyIncidentRows } from "@/lib/dispatch/mappers";

export function useMyTasks() {
  const dispatches = useQuery({
    queryKey: ["dispatches", "mine"],
    queryFn: fetchMyDispatches,
    refetchInterval: TASKS_REFETCH_MS,
  });

  const incidents = useQuery({
    queryKey: ["incidents", "mine"],
    queryFn: fetchMyIncidents,
    refetchInterval: TASKS_REFETCH_MS,
  });

  const now = new Date();
  return {
    dispatches: { isPending: dispatches.isPending, isError: dispatches.isError, rows: toDispatchRows(dispatches.data ?? [], now) },
    incidents: { isPending: incidents.isPending, isError: incidents.isError, rows: toMyIncidentRows(incidents.data ?? [], now) },
  };
}
