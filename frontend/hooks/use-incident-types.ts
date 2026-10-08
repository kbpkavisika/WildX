import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIncidentType, deleteIncidentType, fetchIncidentTypes, updateIncidentType } from "@/lib/api/incident-types";
import { useAuthStore } from "@/lib/auth/store";
import { ROLES } from "@/lib/enums";
import { toIncidentTypeRequest, type IncidentTypeRequestValues } from "@/lib/incidents/incident-type-form";
import { toIncidentTypesView } from "@/lib/incidents/mappers";

interface SaveInput {
  typeId: number | null;
  values: IncidentTypeRequestValues;
}

export function useIncidentTypes() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const canManage = useAuthStore((state) => state.user?.role === ROLES.MANAGER);
  const queryKey = ["parks", parkId, "incident-types"];

  const types = useQuery({
    queryKey,
    queryFn: () => fetchIncidentTypes(parkId as number),
    enabled: parkId !== null,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const save = useMutation({
    mutationFn: ({ typeId, values }: SaveInput) => {
      const request = toIncidentTypeRequest(values);
      return typeId === null
        ? createIncidentType(parkId as number, request)
        : updateIncidentType(parkId as number, typeId, request);
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (typeId: number) => deleteIncidentType(parkId as number, typeId),
    onSuccess: refresh,
  });

  return {
    hasPark: parkId !== null,
    canManage,
    isPending: types.isPending,
    isError: types.isError,
    types: types.data ?? [],
    view: types.data && toIncidentTypesView(types.data),
    save,
    remove,
  };
}
