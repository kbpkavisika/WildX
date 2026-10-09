import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchMyPatrols } from "@/lib/api/patrols";
import { PATROLS_REFETCH_MS } from "@/lib/constants";
import { useOutbox } from "@/lib/outbox/store";
import { withPendingPatrolChanges } from "@/lib/patrols/mappers";

export const MY_PATROLS_KEY = ["patrols", "mine"];

export function useMyPatrols() {
  const rows = useOutbox((state) => state.rows);
  const query = useQuery({ queryKey: MY_PATROLS_KEY, queryFn: fetchMyPatrols, refetchInterval: PATROLS_REFETCH_MS });
  const patrols = useMemo(() => query.data?.map((patrol) => withPendingPatrolChanges(patrol, rows)), [query.data, rows]);
  return { patrols, isPending: query.isPending, isError: query.isError, isRefetching: query.isRefetching, refetch: query.refetch };
}
