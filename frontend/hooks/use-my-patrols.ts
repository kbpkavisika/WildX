import { useQuery } from "@tanstack/react-query";
import { fetchMyPatrols } from "@/lib/api/patrols";
import { TASKS_REFETCH_MS } from "@/lib/constants";
import { toMyPatrolRows } from "@/lib/patrols/table-mappers";

export function useMyPatrols() {
  const patrols = useQuery({
    queryKey: ["patrols", "mine"],
    queryFn: fetchMyPatrols,
    refetchInterval: TASKS_REFETCH_MS,
  });

  return {
    isPending: patrols.isPending,
    isError: patrols.isError,
    rows: toMyPatrolRows(patrols.data ?? [], new Date()),
  };
}
