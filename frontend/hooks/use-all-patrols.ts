import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePatrol, fetchPatrolHistory, fetchPatrols } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";
import { usePatrolsPage } from "@/lib/patrols/store";
import { toPatrolTableView } from "@/lib/patrols/table-mappers";

export function useAllPatrols() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const filter = usePatrolsPage((state) => state.filter);
  const queryClient = useQueryClient();

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

  const remove = useMutation({
    mutationFn: deletePatrol,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patrols"] }),
  });

  return {
    signedIn,
    isPending: patrols.isPending,
    isError: patrols.isError,
    patrols: patrols.data ?? [],
    view: patrols.data && toPatrolTableView(patrols.data, history.data ?? [], filter, new Date()),
    remove,
  };
}
