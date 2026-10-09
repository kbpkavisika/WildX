import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createZone, deleteZone, fetchZones, updateZone } from "@/lib/api/zones";
import { useAuthStore } from "@/lib/auth/store";
import { ROLES } from "@/lib/enums";
import { toZonesView } from "@/lib/zones/mappers";
import { useZonesPage } from "@/lib/zones/store";
import { toZoneRequest, type ZoneFormValues } from "@/lib/zones/zone-form";

interface SaveZone {
  zoneId: number | null;
  values: ZoneFormValues;
}

export function useZones() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const canManage = useAuthStore((state) => state.user?.role === ROLES.MANAGER);
  const zonesKey = ["parks", parkId, "zones"];

  const zones = useQuery({
    queryKey: zonesKey,
    queryFn: () => fetchZones(parkId as number),
    enabled: parkId !== null,
  });

  const save = useMutation({
    mutationFn: ({ zoneId, values }: SaveZone) =>
      zoneId === null ? createZone(parkId as number, toZoneRequest(values)) : updateZone(parkId as number, zoneId, toZoneRequest(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesKey }),
  });

  const remove = useMutation({
    mutationFn: (zoneId: number) => deleteZone(parkId as number, zoneId),
    onSuccess: (_, zoneId) => {
      if (useZonesPage.getState().selectedId === zoneId) useZonesPage.getState().toggle(zoneId);
      return queryClient.invalidateQueries({ queryKey: zonesKey });
    },
  });

  return {
    hasPark: parkId !== null,
    canManage,
    isPending: zones.isPending,
    isError: zones.isError,
    zones: zones.data ?? [],
    view: zones.data && toZonesView(zones.data),
    save,
    remove,
  };
}
