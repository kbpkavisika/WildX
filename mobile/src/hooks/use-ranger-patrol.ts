import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTrack } from "@/lib/api/patrols";
import { PATROLS_REFETCH_MS } from "@/lib/constants";
import { PATROL_STATUSES } from "@/lib/enums";
import { formatTime } from "@/lib/format";
import { savedNotice } from "@/lib/outbox/overlay";
import { useConnection, useOutbox } from "@/lib/outbox/store";
import { save } from "@/lib/outbox/sync";
import { OUTBOX_KINDS } from "@/lib/outbox/types";
import { mergeTrack, toRangerPatrolView } from "@/lib/patrols/mappers";
import { useRangerPatrolPage } from "@/lib/patrols/store";
import type { WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { useTracker } from "@/lib/tracking/store";
import { recordWaypoint } from "@/lib/tracking/task";
import { useMyPatrols } from "./use-my-patrols";
import { useParkSectors } from "./use-park-data";

export function useRangerPatrol(id: number) {
  const sectors = useParkSectors();
  const rows = useOutbox((state) => state.rows);
  const online = useConnection((state) => state.online);
  const fix = useTracker((state) => state.fix);
  const gpsLost = useTracker((state) => state.gpsLost);
  const { setNotice, setPanel, setError } = useRangerPatrolPage();
  const { patrols, isPending, isError } = useMyPatrols();
  const patrol = patrols?.find((candidate) => candidate.id === id);
  const active = patrol?.status === PATROL_STATUSES.ACTIVE;

  const track = useQuery({
    queryKey: ["patrols", id, "track"],
    queryFn: () => fetchTrack(id),
    enabled: patrol !== undefined && patrol.status !== PATROL_STATUSES.PLANNED,
    refetchInterval: active ? PATROLS_REFETCH_MS : false,
  });

  const view = useMemo(() => {
    if (!patrol) return undefined;
    return toRangerPatrolView(patrol, mergeTrack(track.data ?? [], rows, id), new Date());
  }, [patrol, track.data, rows, id]);

  const saveTransition = (kind: typeof OUTBOX_KINDS.PATROL_START | typeof OUTBOX_KINDS.PATROL_END) => {
    if (!patrol) return;
    try {
      save({ kind, patrolId: id, label: patrol.route.name, body: { at: new Date().toISOString() } });
      if (online) setPanel(null);
      else setNotice(savedNotice("Saved", online));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save. Try again.");
    }
  };

  const addWaypoint = (values: WaypointFormValues) => {
    if (!fix) return;
    try {
      const at = recordWaypoint(fix, values.waypointType === "" ? null : values.waypointType, values.note === "" ? null : values.note);
      setNotice(savedNotice(`Waypoint saved at ${formatTime(new Date(at))}`, online));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the waypoint. Try again.");
    }
  };

  return {
    isPending,
    isError: isError && !patrols,
    notFound: patrols !== undefined && !patrol,
    view,
    sectors,
    position: fix?.position ?? null,
    hasFix: fix !== null,
    gpsLost: active && gpsLost,
    start: () => saveTransition(OUTBOX_KINDS.PATROL_START),
    end: () => saveTransition(OUTBOX_KINDS.PATROL_END),
    addWaypoint,
    cancelPanel: () => setPanel(null),
  };
}
