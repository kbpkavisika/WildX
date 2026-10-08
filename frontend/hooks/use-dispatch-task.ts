import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acknowledgeDispatch, completeDispatch, declineDispatch, fetchDispatch } from "@/lib/api/dispatches";
import { fetchIncident } from "@/lib/api/incidents";
import { SOURCE_TYPES } from "@/lib/enums";
import { toDispatchView } from "@/lib/dispatch/mappers";
import { toIncidentDetailView } from "@/lib/incidents/mappers";
import { useIncidentPhoto } from "./use-incident-photo";
import { useParkSectors } from "./use-park-sectors";

export function useDispatchTask(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();

  const dispatch = useQuery({
    queryKey: ["dispatches", id],
    queryFn: () => fetchDispatch(id),
  });

  const incidentId = dispatch.data?.sourceType === SOURCE_TYPES.INCIDENT ? dispatch.data.sourceId : null;
  const incident = useQuery({
    queryKey: ["incidents", incidentId],
    queryFn: () => fetchIncident(incidentId as number),
    enabled: incidentId !== null,
  });

  const photo = useIncidentPhoto(incidentId, incident.data?.photoPath != null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    await queryClient.invalidateQueries({ queryKey: ["incidents"] });
  };

  const acknowledge = useMutation({ mutationFn: () => acknowledgeDispatch(id), onSuccess: refresh });
  const complete = useMutation({ mutationFn: (outcome: string) => completeDispatch(id, outcome), onSuccess: refresh });
  const decline = useMutation({ mutationFn: (reason: string | null) => declineDispatch(id, reason), onSuccess: refresh });

  const now = new Date();
  return {
    isPending: dispatch.isPending,
    error: dispatch.error,
    view: dispatch.data && toDispatchView(dispatch.data, incident.data, now),
    incident: incident.data && toIncidentDetailView(incident.data, now),
    ...photo,
    sectors,
    acknowledge,
    complete,
    decline,
  };
}
