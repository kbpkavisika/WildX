import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchMyDispatches } from "@/lib/api/dispatches";
import { fetchMyIncidents } from "@/lib/api/incidents";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toDispatchRows, withPendingDispatchChanges } from "@/lib/dispatch/mappers";
import { toMyIncidentRows } from "@/lib/incidents/mappers";
import { useOutbox } from "@/lib/outbox/store";

export function useMyTasks() {
  const rows = useOutbox((state) => state.rows);
  const dispatches = useQuery({ queryKey: ["dispatches", "mine"], queryFn: fetchMyDispatches, refetchInterval: TASKS_REFETCH_MS });
  const incidents = useQuery({ queryKey: ["incidents", "mine"], queryFn: fetchMyIncidents, refetchInterval: TASKS_REFETCH_MS });

  const dispatchRows = useMemo(
    () => toDispatchRows((dispatches.data ?? []).map((dispatch) => withPendingDispatchChanges(dispatch, rows)), new Date()),
    [dispatches.data, rows],
  );
  const incidentRows = useMemo(() => toMyIncidentRows(incidents.data ?? [], rows, new Date()), [incidents.data, rows]);

  const refetch = () => Promise.all([dispatches.refetch(), incidents.refetch()]);

  return {
    dispatches: { isPending: dispatches.isPending, isError: dispatches.isError && !dispatches.data, rows: dispatchRows },
    incidents: { isPending: incidents.isPending, isError: incidents.isError && !incidents.data, rows: incidentRows },
    refreshing: dispatches.isRefetching || incidents.isRefetching,
    refetch,
  };
}
