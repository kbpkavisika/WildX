import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "@/lib/api/incidents";
import { fetchSectors } from "@/lib/api/parks";
import { fetchLivePatrols, fetchTrack, type TrackPointResponse } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";
import { toActivePatrolsView } from "@/lib/patrols/mappers";

export function useActivePatrols() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  const live = useQuery({
    queryKey: ["patrols", "live"],
    queryFn: fetchLivePatrols,
    refetchInterval: LIVE_PATROLS_REFETCH_MS,
    enabled: signedIn,
  });

  const tracks = useQueries({
    queries: (live.data ?? []).map(({ patrol }) => ({
      queryKey: ["patrols", patrol.id, "track"],
      queryFn: () => fetchTrack(patrol.id),
      refetchInterval: LIVE_PATROLS_REFETCH_MS,
    })),
    combine: (results) =>
      new Map<number, TrackPointResponse[]>(
        (live.data ?? []).flatMap(({ patrol }, i) => {
          const points = results[i]?.data;
          return points ? [[patrol.id, points]] : [];
        }),
      ),
  });

  const sectors = useQuery({
    queryKey: ["parks", parkId, "sectors"],
    queryFn: () => fetchSectors(parkId as number),
    enabled: signedIn && parkId !== null,
  });

  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: LIVE_PATROLS_REFETCH_MS,
    enabled: signedIn,
  });

  return {
    signedIn,
    isPending: live.isPending,
    isError: live.isError,
    view: live.data && toActivePatrolsView(live.data, tracks, sectors.data ?? [], incidents.data ?? [], new Date()),
  };
}
