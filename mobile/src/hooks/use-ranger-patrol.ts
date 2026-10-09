import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiErrorMessage } from "@/lib/api/client";
import { endPatrol, fetchTrack, startPatrol } from "@/lib/api/patrols";
import { PATROLS_REFETCH_MS } from "@/lib/constants";
import { PATROL_STATUSES } from "@/lib/enums";
import { formatTime } from "@/lib/format";
import { isNearRoute, toRangerPatrolView, toTrack } from "@/lib/patrols/mappers";
import { useRangerPatrolPage } from "@/lib/patrols/store";
import type { WaypointFormValues } from "@/lib/patrols/waypoint-form";
import type { GpsFix } from "@/lib/tracking/sampling";
import { useTracker } from "@/lib/tracking/store";
import { recordWaypoint } from "@/lib/tracking/task";
import { useMyPatrols } from "./use-my-patrols";
import { useParkSectors } from "./use-park-data";

type Transition = "start" | "end";

export function useRangerPatrol(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();
  const trackerFix = useTracker((state) => state.fix);
  const gpsLost = useTracker((state) => state.gpsLost);
  const { setNotice, setPanel, setError } = useRangerPatrolPage();
  const { patrols, isPending, isError } = useMyPatrols();
  const patrol = patrols?.find((candidate) => candidate.id === id);
  const active = patrol?.status === PATROL_STATUSES.ACTIVE;
  const trackKey = ["patrols", id, "track"];

  const track = useQuery({
    queryKey: trackKey,
    queryFn: () => fetchTrack(id),
    enabled: patrol !== undefined && patrol.status !== PATROL_STATUSES.PLANNED,
    refetchInterval: active ? PATROLS_REFETCH_MS : false,
  });

  const view = useMemo(() => patrol && toRangerPatrolView(patrol, toTrack(track.data ?? []), new Date()), [patrol, track.data]);
  const fix = trackerFix && view && isNearRoute(view.route, trackerFix.position) ? trackerFix : null;

  const transition = useMutation({
    mutationFn: (kind: Transition) => {
      const at = new Date().toISOString();
      return kind === "start" ? startPatrol(id, at) : endPatrol(id, at);
    },
    onSuccess: () => {
      setPanel(null);
      void queryClient.invalidateQueries({ queryKey: ["patrols"] });
    },
    onError: (error) => setError(apiErrorMessage(error)),
  });

  const waypoint = useMutation({
    mutationFn: ({ values, point }: { values: WaypointFormValues; point: Pick<GpsFix, "position" | "accuracyM"> }) =>
      recordWaypoint(point, values.waypointType === "" ? null : values.waypointType, values.note === "" ? null : values.note),
    onSuccess: (at) => {
      setNotice(`Waypoint saved at ${formatTime(new Date(at))}.`);
      void queryClient.invalidateQueries({ queryKey: trackKey });
    },
    onError: (error) => setError(apiErrorMessage(error)),
  });

  const run = (kind: Transition) => {
    setError(null);
    transition.mutate(kind);
  };

  return {
    isPending,
    isError: isError && !patrols,
    notFound: patrols !== undefined && !patrol,
    view,
    sectors,
    position: fix?.position ?? null,
    gpsLost: active && gpsLost,
    busy: transition.isPending ? transition.variables : null,
    savingWaypoint: waypoint.isPending,
    start: () => run("start"),
    end: () => run("end"),
    addWaypoint: (values: WaypointFormValues) => {
      const point = values.position ? { position: values.position, accuracyM: null } : fix;
      setError(point ? null : "Waiting for GPS. Tap the map to choose the location.");
      if (point) waypoint.mutate({ values, point });
    },
    cancelPanel: () => setPanel(null),
  };
}
