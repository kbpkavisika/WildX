import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeIncidentSeverity, dismissIncident, fetchIncident } from "@/lib/api/incidents";
import type { Severity } from "@/lib/enums";
import { toIncidentDetailView } from "@/lib/incidents/mappers";
import { useIncidentPhoto } from "./use-incident-photo";
import { useParkSectors } from "./use-park-sectors";

export function useIncidentDetail(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();

  const incident = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => fetchIncident(id),
  });

  const photo = useIncidentPhoto(id, incident.data?.photoPath != null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["incidents"] });

  const severity = useMutation({
    mutationFn: (value: Severity) => changeIncidentSeverity(id, value),
    onSuccess: refresh,
  });

  const dismiss = useMutation({
    mutationFn: (reason: string) => dismissIncident(id, reason),
    onSuccess: refresh,
  });

  return {
    isPending: incident.isPending,
    error: incident.error,
    view: incident.data && toIncidentDetailView(incident.data, new Date()),
    ...photo,
    sectors,
    severity,
    dismiss,
    refresh,
  };
}
