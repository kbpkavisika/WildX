import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { acknowledgeAlert, fetchAlerts, resolveAlert } from "@/lib/api/alerts";
import { apiErrorMessage } from "@/lib/api/client";
import { toRangerAlertsView } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import { ALERTS_REFETCH_MS } from "@/lib/constants";
import type { Disposition } from "@/lib/enums";

const ALERTS_KEY = ["alerts"];

interface AlertAction {
  send: () => Promise<unknown>;
  done: string;
}

export function useRangerAlerts() {
  const queryClient = useQueryClient();
  const setNotice = useAlertsPage((state) => state.setNotice);
  const alerts = useQuery({ queryKey: ALERTS_KEY, queryFn: fetchAlerts, refetchInterval: ALERTS_REFETCH_MS });

  const view = useMemo(() => alerts.data && toRangerAlertsView(alerts.data, new Date()), [alerts.data]);

  const action = useMutation({
    mutationFn: ({ send }: AlertAction) => send(),
    onSuccess: (_, { done }) => {
      setNotice(done);
      void queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });

  return {
    isPending: alerts.isPending,
    isError: alerts.isError && !alerts.data,
    isRefetching: alerts.isRefetching,
    refetch: alerts.refetch,
    view,
    error: action.error ? apiErrorMessage(action.error) : null,
    acknowledge: (id: number) => action.mutate({ send: () => acknowledgeAlert(id), done: "Acknowledged." }),
    resolve: (id: number, disposition: Disposition) => action.mutate({ send: () => resolveAlert(id, disposition), done: "Alert resolved." }),
  };
}
