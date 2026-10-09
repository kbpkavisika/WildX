import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSector, deleteSector, fetchSectors, updateCoverageSettings, updateSector } from "@/lib/api/parks";
import { useCan } from "@/hooks/use-can";
import { useAuthStore } from "@/lib/auth/store";
import { toSectorRequest, type SectorFormValues } from "@/lib/parks/forms";

interface SaveSector {
  sectorId: number | null;
  values: SectorFormValues;
}

export function useSectors() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const canManage = useCan("settings.manage");
  const sectorsKey = ["parks", parkId, "sectors"];

  const sectors = useQuery({
    queryKey: sectorsKey,
    queryFn: () => fetchSectors(parkId as number),
    enabled: parkId !== null,
  });

  const save = useMutation({
    mutationFn: ({ sectorId, values }: SaveSector) =>
      sectorId === null
        ? createSector(parkId as number, toSectorRequest(values))
        : updateSector(parkId as number, sectorId, toSectorRequest(values)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: sectorsKey }),
        queryClient.invalidateQueries({ queryKey: ["patrols", "coverage"] }),
      ]),
  });

  const remove = useMutation({
    mutationFn: (sectorId: number) => deleteSector(parkId as number, sectorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectorsKey }),
  });

  const saveNeglectDays = useMutation({
    mutationFn: (neglectDays: number) => updateCoverageSettings(parkId as number, neglectDays),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["parks", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["patrols", "coverage"] }),
      ]),
  });

  return {
    hasPark: parkId !== null,
    canManage,
    isPending: sectors.isPending,
    isError: sectors.isError,
    sectors: sectors.data ?? [],
    save,
    remove,
    saveNeglectDays,
  };
}
