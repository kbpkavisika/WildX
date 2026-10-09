import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchAlerts } from "@/lib/api/alerts";
import { toRangerAlertsView, withPendingAlertChanges } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import { useSession } from "@/lib/auth/store";
import { ALERTS_REFETCH_MS } from "@/lib/constants";
import type { Disposition } from "@/lib/enums";
import { savedNotice } from "@/lib/outbox/overlay";
import { useConnection, useOutbox } from "@/lib/outbox/store";
import { save } from "@/lib/outbox/sync";
import { OUTBOX_KINDS } from "@/lib/outbox/types";

export function useRangerAlerts() {
  const rows = useOutbox((state) => state.rows);
  const online = useConnection((state) => state.online);
  const userName = useSession((state) => state.user?.name ?? "");
  const setNotice = useAlertsPage((state) => state.setNotice);
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: fetchAlerts, refetchInterval: ALERTS_REFETCH_MS });

  const view = useMemo(() => {
    if (!alerts.data) return undefined;
    const local = alerts.data.flatMap((alert) => withPendingAlertChanges(alert, rows, userName) ?? []);
    return toRangerAlertsView(local, new Date());
  }, [alerts.data, rows, userName]);

  const acknowledge = (id: number, title: string) => {
    save({ kind: OUTBOX_KINDS.ALERT_ACK, targetId: id, label: title, body: {} });
    if (!online) setNotice(savedNotice("Saved", online));
  };

  const resolve = (id: number, title: string, disposition: Disposition) => {
    save({ kind: OUTBOX_KINDS.ALERT_RESOLVE, targetId: id, label: title, body: { disposition } });
    setNotice(savedNotice("Alert resolved", online));
  };

  return {
    isPending: alerts.isPending,
    isError: alerts.isError && !alerts.data,
    isRefetching: alerts.isRefetching,
    refetch: alerts.refetch,
    view,
    acknowledge,
    resolve,
  };
}
