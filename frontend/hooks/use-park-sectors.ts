import { useQuery } from "@tanstack/react-query";
import { fetchSectors } from "@/lib/api/parks";
import { useAuthStore } from "@/lib/auth/store";
import { toSectorShape } from "@/lib/patrols/mappers";
import type { SectorShape } from "@/lib/patrols/types";

export function useParkSectors(): SectorShape[] {
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const sectors = useQuery({
    queryKey: ["parks", parkId, "sectors"],
    queryFn: () => fetchSectors(parkId as number),
    enabled: parkId !== null,
  });
  return (sectors.data ?? []).flatMap((sector) => toSectorShape(sector) ?? []);
}
