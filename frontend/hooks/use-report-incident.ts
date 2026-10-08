import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportIncident } from "@/lib/api/incidents";
import { fetchSectors } from "@/lib/api/parks";
import { toActiveTypeOptions } from "@/lib/incidents/mappers";
import { toIncidentCreateRequest, type ReportIncidentSubmit } from "@/lib/incidents/report-form";
import { toSectorShape } from "@/lib/patrols/mappers";
import { useParkIncidentTypes } from "./use-incident-types";

export function useReportIncident() {
  const queryClient = useQueryClient();
  const types = useParkIncidentTypes();
  const parkId = types.parkId;

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
