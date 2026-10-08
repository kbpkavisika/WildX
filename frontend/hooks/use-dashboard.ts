import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/lib/api/dashboard";
import { DASHBOARD_REFETCH_MS } from "@/lib/constants";
import { toDashboardView } from "@/lib/dashboard/mappers";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    select: (data) => toDashboardView(data, new Date()),
    refetchInterval: DASHBOARD_REFETCH_MS,
  });
}
