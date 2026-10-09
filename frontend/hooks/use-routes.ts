import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, fetchRoutes } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { toRouteRequest, type RouteFormValues } from "@/lib/patrols/route-form";
import { toRouteRow } from "@/lib/patrols/route-mappers";

export function useRoutes() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const queryClient = useQueryClient();
  const routes = useQuery({ queryKey: ["routes"], queryFn: fetchRoutes, enabled: signedIn });
  const create = useMutation({
    mutationFn: (values: RouteFormValues) => createRoute(toRouteRequest(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routes"] }),
  });
  return {
    signedIn,
    isPending: routes.isPending,
    isError: routes.isError,
    rows: routes.data?.map(toRouteRow),
    create,
  };
}
