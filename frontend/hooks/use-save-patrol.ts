import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPatrol, fetchRangers, fetchRoutes, updatePatrol } from "@/lib/api/patrols";
import { toAssignRequest, toUpdateRequest, type PatrolFormValues } from "@/lib/patrols/patrol-form";

export function useSavePatrol(patrolId: number | null, onSaved: () => void) {
  const queryClient = useQueryClient();
  const routes = useQuery({ queryKey: ["routes"], queryFn: fetchRoutes });
  const rangers = useQuery({ queryKey: ["rangers"], queryFn: fetchRangers });
  const save = useMutation({
    mutationFn: (values: PatrolFormValues): Promise<unknown> =>
      patrolId === null ? assignPatrol(toAssignRequest(values)) : updatePatrol(patrolId, toUpdateRequest(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patrols"] });
      onSaved();
    },
  });
  return { routes: routes.data ?? [], rangers: rangers.data ?? [], save };
}
