import { useQuery } from "@tanstack/react-query";
import { fetchIncidentPhoto } from "@/lib/api/incidents";
import { blobToDataUrl } from "@/lib/files";

export function useIncidentPhoto(incidentId: number | null, hasPhoto: boolean) {
  const photo = useQuery({
    queryKey: ["incident-photo", incidentId],
    queryFn: () => fetchIncidentPhoto(incidentId as number).then(blobToDataUrl),
    enabled: incidentId !== null && hasPhoto,
    staleTime: Infinity,
  });
  return { photoUrl: photo.data ?? null, photoError: photo.isError };
}
