import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, deleteRoute, fetchRoutes, updateRoute } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { toRouteRequest, type RouteFormValues } from "@/lib/patrols/route-form";
import { toRouteRow } from "@/lib/patrols/route-mappers";

const ROUTES_KEY = ["routes"];

interface SaveRoute {
  routeId: number | null;
  values: RouteFormValues;
}

export function useRoutes() {
  const signedIn = useAuthStore((state) => state.token !== null);
  const queryClient = useQueryClient();
  const routes = useQuery({ queryKey: ROUTES_KEY, queryFn: fetchRoutes, enabled: signedIn });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ROUTES_KEY });
  const save = useMutation({
    mutationFn: ({ routeId, values }: SaveRoute) =>
      routeId === null ? createRoute(toRouteRequest(values)) : updateRoute(routeId, toRouteRequest(values)),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: deleteRoute, onSuccess: refresh });
  return {
    signedIn,
    isPending: routes.isPending,
    isError: routes.isError,
    routes: routes.data ?? [],
    rows: routes.data?.map(toRouteRow),
    save,
    remove,
  };
}
