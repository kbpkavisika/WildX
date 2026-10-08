import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeIncidentSeverity, dismissIncident, fetchIncident, fetchIncidentPhoto } from "@/lib/api/incidents";
import type { Severity } from "@/lib/enums";
import { blobToDataUrl } from "@/lib/files";
import { toIncidentDetailView } from "@/lib/incidents/mappers";
import { useParkSectors } from "./use-park-sectors";

export function useIncidentDetail(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();

  const incident = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => fetchIncident(id),
  });

  const hasPhoto = incident.data?.photoPath != null;
  const photo = useQuery({
    queryKey: ["incident-photo", id],
    queryFn: () => fetchIncidentPhoto(id).then(blobToDataUrl),
    enabled: hasPhoto,
    staleTime: Infinity,
  });

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
    photoUrl: photo.data ?? null,
    photoError: photo.isError,
    sectors,
    severity,
    dismiss,
    refresh,
  };
}
