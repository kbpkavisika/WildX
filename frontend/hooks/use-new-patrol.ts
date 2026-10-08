import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPatrol, fetchRangers, fetchRoutes } from "@/lib/api/patrols";
import { toAssignRequest, type NewPatrolValues } from "@/lib/patrols/new-patrol-form";

export function useNewPatrol(onCreated: () => void) {
  const queryClient = useQueryClient();
  const routes = useQuery({ queryKey: ["routes"], queryFn: fetchRoutes });
  const rangers = useQuery({ queryKey: ["rangers"], queryFn: fetchRangers });
  const assign = useMutation({
    mutationFn: (values: NewPatrolValues) => assignPatrol(toAssignRequest(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patrols"] });
      onCreated();
    },
  });
  return { routes: routes.data ?? [], rangers: rangers.data ?? [], assign };
}
