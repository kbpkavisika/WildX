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

function incidentTypesKey(parkId: number | null) {
  return ["parks", parkId, "incident-types"];
}

export function useParkIncidentTypes() {
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const query = useQuery({
    queryKey: incidentTypesKey(parkId),
    queryFn: () => fetchIncidentTypes(parkId as number),
    enabled: parkId !== null,
  });
  return { parkId, ...query };
}

export function useIncidentTypes() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === ROLES.MANAGER);
  const types = useParkIncidentTypes();
  const parkId = types.parkId as number;

  const refresh = () => queryClient.invalidateQueries({ queryKey: incidentTypesKey(types.parkId) });

  const save = useMutation({
    mutationFn: ({ typeId, values }: SaveInput) => {
      const request = toIncidentTypeRequest(values);
      return typeId === null ? createIncidentType(parkId, request) : updateIncidentType(parkId, typeId, request);
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (typeId: number) => deleteIncidentType(parkId, typeId),
    onSuccess: refresh,
  });

  return {
    hasPark: types.parkId !== null,
    canManage,
    isPending: types.isPending,
    isError: types.isError,
    types: types.data ?? [],
    view: types.data && toIncidentTypesView(types.data),
    save,
    remove,
  };
}
