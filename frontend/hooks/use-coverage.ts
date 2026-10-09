import { useQuery } from "@tanstack/react-query";
import { fetchCoverage } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";
import { toCoverageView } from "@/lib/patrols/coverage-mappers";

export function useCoverage() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const coverage = useQuery({
    queryKey: ["patrols", "coverage"],
    queryFn: fetchCoverage,
    refetchInterval: LIVE_PATROLS_REFETCH_MS,
    enabled: signedIn,
  });
  return {
    signedIn,
    isPending: coverage.isPending,
    isError: coverage.isError,
    view: coverage.data && toCoverageView(coverage.data),
  };
}
