import { useQuery } from "@tanstack/react-query";
import { fetchPatrolHistory, fetchPatrols } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";
import { usePatrolsPage } from "@/lib/patrols/store";
import { toPatrolTableView } from "@/lib/patrols/table-mappers";

export function useAllPatrols() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const filter = usePatrolsPage((state) => state.filter);

  const patrols = useQuery({
    queryKey: ["patrols", "list"],
    queryFn: fetchPatrols,
    refetchInterval: LIVE_PATROLS_REFETCH_MS,
    enabled: signedIn,
  });

  const history = useQuery({
    queryKey: ["patrols", "history"],
    queryFn: fetchPatrolHistory,
    enabled: signedIn,
  });

  return {
    signedIn,
    isPending: patrols.isPending,
    isError: patrols.isError,
    view: patrols.data && toPatrolTableView(patrols.data, history.data ?? [], filter, new Date()),
  };
}
