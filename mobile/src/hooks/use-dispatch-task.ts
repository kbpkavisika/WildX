import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiErrorMessage } from "@/lib/api/client";
import { acknowledgeDispatch, completeDispatch, declineDispatch, fetchDispatch } from "@/lib/api/dispatches";
import { fetchIncident, incidentPhotoSource } from "@/lib/api/incidents";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toDispatchView } from "@/lib/dispatch/mappers";
import { useDispatchTaskPage } from "@/lib/dispatch/store";
import { SOURCE_TYPES } from "@/lib/enums";
import { toIncidentDetailView } from "@/lib/incidents/mappers";
import { useParkSectors } from "./use-park-data";

interface DispatchAction {
  send: () => Promise<unknown>;
  done: string;
}

export function useDispatchTask(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();
  const setNotice = useDispatchTaskPage((state) => state.setNotice);

  const dispatch = useQuery({ queryKey: ["dispatches", id], queryFn: () => fetchDispatch(id), refetchInterval: TASKS_REFETCH_MS });
  const incidentId = dispatch.data?.sourceType === SOURCE_TYPES.INCIDENT ? dispatch.data.sourceId : null;
  const incident = useQuery({
    queryKey: ["incidents", incidentId],
    queryFn: () => fetchIncident(incidentId as number),
    enabled: incidentId !== null,
  });

  const view = useMemo(() => dispatch.data && toDispatchView(dispatch.data, incident.data, new Date()), [dispatch.data, incident.data]);
  const detail = useMemo(() => incident.data && toIncidentDetailView(incident.data), [incident.data]);

  const action = useMutation({
    mutationFn: ({ send }: DispatchAction) => send(),
    onSuccess: (_, { done }) => {
      setNotice(done);
      ["dispatches", "incidents", "alerts"].forEach((key) => void queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  return {
    isPending: dispatch.isPending,
    isError: dispatch.isError && !dispatch.data,
    view,
    incident: detail,
    photoSource: incidentId !== null && detail?.hasPhoto ? incidentPhotoSource(incidentId) : null,
    sectors,
    error: action.error ? apiErrorMessage(action.error) : null,
    acknowledge: () => action.mutate({ send: () => acknowledgeDispatch(id), done: "Acknowledged." }),
    complete: (outcome: string) => action.mutate({ send: () => completeDispatch(id, outcome), done: "Completed." }),
    decline: (reason: string | null) => action.mutate({ send: () => declineDispatch(id, reason), done: "Declined." }),
  };
}
