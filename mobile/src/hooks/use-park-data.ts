import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchIncidentTypes, fetchSectors } from "@/lib/api/incidents";
import { useSession } from "@/lib/auth/store";
import { toSectorShape, type SectorShape } from "@/lib/geo";
import { toActiveTypeOptions } from "@/lib/incidents/mappers";

function useParkId(): number | null {
  return useSession((state) => state.user?.parkId ?? null);
}

export function useParkSectors(): SectorShape[] {
  const parkId = useParkId();
  const sectors = useQuery({
    queryKey: ["parks", parkId, "sectors"],
    queryFn: () => fetchSectors(parkId as number),
    enabled: parkId !== null,
  });
  return useMemo(() => (sectors.data ?? []).flatMap((sector) => toSectorShape(sector) ?? []), [sectors.data]);
}

export function useIncidentTypeOptions() {
  const parkId = useParkId();
  const types = useQuery({
    queryKey: ["parks", parkId, "incident-types"],
    queryFn: () => fetchIncidentTypes(parkId as number),
    enabled: parkId !== null,
  });
  const options = useMemo(() => toActiveTypeOptions(types.data ?? []), [types.data]);
  return { options, isError: types.isError && types.data === undefined };
}
