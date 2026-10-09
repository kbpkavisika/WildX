import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endPatrol, fetchTrack, recordPoints, startPatrol } from "@/lib/api/patrols";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";
import { PATROL_STATUSES } from "@/lib/enums";
import { formatTime } from "@/lib/format";
import { toRangerPatrolView } from "@/lib/patrols/ranger-mappers";
import { useRangerPatrolPage, useTracker } from "@/lib/patrols/store";
import type { GpsFix } from "@/lib/patrols/tracking";
import { toWaypointRequest, type WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { MY_PATROLS_KEY, useMyPatrols } from "./use-my-patrols";
import { useParkSectors } from "./use-park-sectors";

export function useRangerPatrol(id: number) {
  const queryClient = useQueryClient();
  const sectors = useParkSectors();
  const fix = useTracker((state) => state.fix);
  const gpsLost = useTracker((state) => state.gpsLost);
  const setNotice = useRangerPatrolPage((state) => state.setNotice);
  const patrols = useMyPatrols();
  const patrol = patrols.data?.find((candidate) => candidate.id === id);
  const active = patrol?.status === PATROL_STATUSES.ACTIVE;
  const trackKey = ["patrols", id, "track"];

  const track = useQuery({
    queryKey: trackKey,
    queryFn: () => fetchTrack(id),
    enabled: patrol !== undefined && patrol.status !== PATROL_STATUSES.PLANNED,
    refetchInterval: active ? LIVE_PATROLS_REFETCH_MS : false,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: MY_PATROLS_KEY });
    await queryClient.invalidateQueries({ queryKey: trackKey });
  };

  const start = useMutation({ mutationFn: () => startPatrol(id, new Date().toISOString()), onSuccess: refresh });
  const end = useMutation({ mutationFn: () => endPatrol(id, new Date().toISOString()), onSuccess: refresh });
  const waypoint = useMutation({
    mutationFn: ({ values, at }: { values: WaypointFormValues; at: GpsFix }) =>
      recordPoints(id, [toWaypointRequest(values, at, Date.now())]),
    onSuccess: async (saved) => {
      const at = saved[0] ? formatTime(new Date(saved[0].recordedAt)) : formatTime(new Date());
      setNotice(`Waypoint saved at ${at}.`);
      await queryClient.invalidateQueries({ queryKey: trackKey });
    },
  });

  return {
    isPending: patrols.isPending,
    isError: patrols.isError,
    notFound: patrols.isSuccess && !patrol,
    view: patrol && toRangerPatrolView(patrol, track.data ?? [], new Date()),
    sectors,
    fix,
    gpsLost: active && gpsLost,
    start,
    end,
    waypoint,
  };
}
