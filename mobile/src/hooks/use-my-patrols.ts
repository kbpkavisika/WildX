import { useQuery } from "@tanstack/react-query";
import { fetchMyPatrols } from "@/lib/api/patrols";
import { PATROLS_REFETCH_MS } from "@/lib/constants";

export const MY_PATROLS_KEY = ["patrols", "mine"];

export function useMyPatrols() {
  const query = useQuery({ queryKey: MY_PATROLS_KEY, queryFn: fetchMyPatrols, refetchInterval: PATROLS_REFETCH_MS });
  return { patrols: query.data, isPending: query.isPending, isError: query.isError, isRefetching: query.isRefetching, refetch: query.refetch };
}
