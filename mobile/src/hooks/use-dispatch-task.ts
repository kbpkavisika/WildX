import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchDispatch } from "@/lib/api/dispatches";
import { fetchIncident, incidentPhotoSource } from "@/lib/api/incidents";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toDispatchView, withPendingDispatchChanges } from "@/lib/dispatch/mappers";
import { useDispatchTaskPage } from "@/lib/dispatch/store";
import { SOURCE_TYPES } from "@/lib/enums";
import { toIncidentDetailView } from "@/lib/incidents/mappers";
import { savedNotice } from "@/lib/outbox/overlay";
import { useConnection, useOutbox } from "@/lib/outbox/store";
import { save } from "@/lib/outbox/sync";
import { OUTBOX_KINDS, type OutboxKind } from "@/lib/outbox/types";
import { useParkSectors } from "./use-park-data";

export function useDispatchTask(id: number) {
  const sectors = useParkSectors();
  const rows = useOutbox((state) => state.rows);
  const online = useConnection((state) => state.online);
  const setNotice = useDispatchTaskPage((state) => state.setNotice);

  const dispatch = useQuery({ queryKey: ["dispatches", id], queryFn: () => fetchDispatch(id), refetchInterval: TASKS_REFETCH_MS });
  const incidentId = dispatch.data?.sourceType === SOURCE_TYPES.INCIDENT ? dispatch.data.sourceId : null;
  const incident = useQuery({
    queryKey: ["incidents", incidentId],
    queryFn: () => fetchIncident(incidentId as number),
    enabled: incidentId !== null,
  });

  const view = useMemo(
    () => dispatch.data && toDispatchView(withPendingDispatchChanges(dispatch.data, rows), incident.data, new Date()),
    [dispatch.data, incident.data, rows],
  );
  const detail = useMemo(() => incident.data && toIncidentDetailView(incident.data), [incident.data]);

  const act = (kind: OutboxKind, body: unknown, action: string) => {
    save({ kind, targetId: id, label: view?.title ?? `Dispatch ${id}`, body });
    setNotice(savedNotice(action, online));
  };

  return {
    isPending: dispatch.isPending,
    isError: dispatch.isError && !dispatch.data,
    view,
    incident: detail,
    photoSource: incidentId !== null && detail?.hasPhoto ? incidentPhotoSource(incidentId) : null,
    sectors,
    acknowledge: () => act(OUTBOX_KINDS.DISPATCH_ACK, {}, "Acknowledged"),
    complete: (outcome: string) => act(OUTBOX_KINDS.DISPATCH_COMPLETE, { outcome }, "Completed"),
    decline: (reason: string | null) => act(OUTBOX_KINDS.DISPATCH_DECLINE, { reason }, "Declined"),
  };
}
