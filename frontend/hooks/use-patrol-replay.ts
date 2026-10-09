import { useQuery } from "@tanstack/react-query";
import { fetchPatrolHistory, fetchPatrols, fetchTrack } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { toReplayView } from "@/lib/patrols/replay-mappers";
import { useReplayScrub } from "@/lib/patrols/store";

export function usePatrolReplay(id: number) {
  const signedIn = useAuthStore((state) => state.token !== null);
  const scrubIndex = useReplayScrub((state) => (state.patrolId === id ? state.index : null));
  const scrub = useReplayScrub((state) => state.scrub);

  const patrols = useQuery({ queryKey: ["patrols", "list"], queryFn: fetchPatrols, enabled: signedIn });
  const history = useQuery({ queryKey: ["patrols", "history"], queryFn: fetchPatrolHistory, enabled: signedIn });
  const track = useQuery({ queryKey: ["patrols", id, "track"], queryFn: () => fetchTrack(id), enabled: signedIn });

  const patrol = patrols.data?.find((candidate) => candidate.id === id);
  const entry = history.data?.find((candidate) => candidate.patrol.id === id);

  return {
    isPending: patrols.isPending || track.isPending,
    isError: patrols.isError || track.isError,
    notFound: patrols.isSuccess && !patrol,
    view: patrol && track.data ? toReplayView(patrol, entry, track.data, scrubIndex) : undefined,
    scrub: (index: number) => scrub(id, index),
  };
}
