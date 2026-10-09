import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAlertRules } from "@/lib/api/alert-rules";
import { createZone, deleteZone, fetchZones, updateZone } from "@/lib/api/zones";
import { useCan } from "@/hooks/use-can";
import { useAuthStore } from "@/lib/auth/store";
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
  const canManage = useCan("settings.manage");
  const zonesKey = ["parks", parkId, "zones"];

  const zones = useQuery({
    queryKey: zonesKey,
    queryFn: () => fetchZones(parkId as number),
    enabled: parkId !== null,
  });

  const rules = useQuery({
    queryKey: ["parks", parkId, "alert-rules"],
    queryFn: () => fetchAlertRules(parkId as number),
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
    isPending: zones.isPending || rules.isPending,
    isError: zones.isError || rules.isError,
    zones: zones.data ?? [],
    rules: rules.data ?? [],
    view: zones.data && rules.data && toZonesView(zones.data, rules.data),
    save,
    remove,
  };
}
