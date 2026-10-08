import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acknowledgeAlert, resolveAlert } from "@/lib/api/alerts";
import type { Disposition } from "@/lib/enums";

export function useAlertActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["alerts"] });

  const acknowledge = useMutation({
    mutationFn: (id: number) => acknowledgeAlert(id),
    onSettled: refresh,
  });

  const resolve = useMutation({
    mutationFn: ({ id, disposition }: { id: number; disposition: Disposition }) => resolveAlert(id, disposition),
    onSettled: refresh,
  });

  return { acknowledge, resolve, refresh };
}
