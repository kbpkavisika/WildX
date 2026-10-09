import { useQuery } from "@tanstack/react-query";
import { fetchMyDispatches } from "@/lib/api/dispatches";
import { fetchMyIncidents } from "@/lib/api/incidents";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toDispatchRows, toMyIncidentRows } from "@/lib/dispatch/mappers";
import { toOutboxRows } from "@/lib/incidents/outbox-mappers";
import { useOutbox } from "./use-outbox";

export function useMyTasks() {
  const { reports, remove } = useOutbox();

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
  const waiting = toOutboxRows(reports.data ?? [], now);
  return {
    dispatches: { isPending: dispatches.isPending, isError: dispatches.isError, rows: toDispatchRows(dispatches.data ?? [], now) },
    incidents: {
      isPending: waiting.length === 0 && incidents.isPending,
      isError: incidents.isError,
      rows: [...waiting, ...toMyIncidentRows(incidents.data ?? [], now)],
      onDelete: (id: string | number) => remove.mutate(String(id)),
    },
  };
}
