import { useMutation, useQuery } from "@tanstack/react-query";
import { createDispatch, fetchResponders, type DispatchResponse } from "@/lib/api/dispatches";
import { toDispatchRequest, type DispatchFormValues, type DispatchSource } from "@/lib/dispatch/dispatch-form";
import { toResponderOptions } from "@/lib/dispatch/mappers";
import type { LatLng } from "@/lib/patrols/types";

export function useDispatch(source: DispatchSource, position: LatLng | null, onDispatched: (dispatch: DispatchResponse) => void) {
  const responders = useQuery({
    queryKey: ["responders", position?.[0] ?? null, position?.[1] ?? null],
    queryFn: () => fetchResponders(position),
  });

  const dispatch = useMutation({
    mutationFn: (values: DispatchFormValues) => createDispatch(toDispatchRequest(source, values)),
    onSuccess: onDispatched,
  });

  return {
    isPending: responders.isPending,
    isError: responders.isError,
    options: responders.data ? toResponderOptions(responders.data, new Date()) : [],
    dispatch,
  };
}
