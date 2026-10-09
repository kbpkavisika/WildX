import { useMutation, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useState } from "react";
import { apiErrorMessage, NetworkError } from "@/lib/api/client";
import { reportIncident } from "@/lib/api/incidents";
import { toIncidentCreateRequest, type ReportIncidentSubmit } from "@/lib/incidents/report-form";
import { saveOffline } from "@/lib/offline-reports/sender";
import { useIncidentTypeOptions, useParkSectors } from "./use-park-data";

const REPORTED_NOTICE = "Incident reported.";
const SAVED_OFFLINE_NOTICE = "Saved on this phone. It will be sent when you're back online.";

export function useReportIncident() {
  const queryClient = useQueryClient();
  const types = useIncidentTypeOptions();
  const sectors = useParkSectors();
  const [formKey, setFormKey] = useState(0);

  const report = useMutation({
    mutationFn: async (values: ReportIncidentSubmit) => {
      const request = toIncidentCreateRequest(randomUUID(), values, new Date());
      const photoUri = values.photo?.uri ?? null;
      try {
        await reportIncident(request, photoUri);
        return REPORTED_NOTICE;
      } catch (error) {
        if (!(error instanceof NetworkError)) throw error;
        const typeName = types.options.find((type) => String(type.id) === values.typeId)?.name ?? "Incident";
        await saveOffline(typeName, request, photoUri);
        return SAVED_OFFLINE_NOTICE;
      }
    },
    onSuccess: () => {
      setFormKey((key) => key + 1);
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  return {
    typeOptions: types.options,
    typesError: types.isError,
    sectors,
    saving: report.isPending,
    notice: report.data ?? null,
    error: report.error ? apiErrorMessage(report.error) : null,
    formKey,
    submit: (values: ReportIncidentSubmit) => report.mutate(values),
  };
}
