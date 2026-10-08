import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIncidentTypes } from "@/lib/api/incident-types";
import { reportIncident } from "@/lib/api/incidents";
import { fetchSectors } from "@/lib/api/parks";
import { useAuthStore } from "@/lib/auth/store";
import { toActiveTypeOptions } from "@/lib/incidents/mappers";
import { toIncidentCreateRequest, type ReportIncidentSubmit } from "@/lib/incidents/report-form";
import { toSectorShape } from "@/lib/patrols/mappers";

export function useReportIncident() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  const types = useQuery({
    queryKey: ["parks", parkId, "incident-types"],
    queryFn: () => fetchIncidentTypes(parkId as number),
    enabled: parkId !== null,
  });

  const sectors = useQuery({
    queryKey: ["parks", parkId, "sectors"],
    queryFn: () => fetchSectors(parkId as number),
    enabled: parkId !== null,
  });

  const submit = useMutation({
    mutationFn: (values: ReportIncidentSubmit) => reportIncident(toIncidentCreateRequest(values, new Date()), values.photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });

  return {
    typeOptions: toActiveTypeOptions(types.data ?? []),
    typesError: types.isError,
    sectors: (sectors.data ?? []).flatMap((sector) => toSectorShape(sector) ?? []),
    submit,
  };
}
