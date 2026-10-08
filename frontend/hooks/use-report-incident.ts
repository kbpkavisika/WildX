import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportIncident } from "@/lib/api/incidents";
import { toActiveTypeOptions } from "@/lib/incidents/mappers";
import { toIncidentCreateRequest, type ReportIncidentSubmit } from "@/lib/incidents/report-form";
import { useParkIncidentTypes } from "./use-incident-types";
import { useParkSectors } from "./use-park-sectors";

export function useReportIncident() {
  const queryClient = useQueryClient();
  const types = useParkIncidentTypes();
  const sectors = useParkSectors();

  const submit = useMutation({
    mutationFn: (values: ReportIncidentSubmit) => reportIncident(toIncidentCreateRequest(values, new Date()), values.photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });

  return {
    typeOptions: toActiveTypeOptions(types.data ?? []),
    typesError: types.isError,
    sectors,
    submit,
  };
}
