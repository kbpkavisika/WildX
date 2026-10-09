import { useQuery } from "@tanstack/react-query";
import { fetchCommunityReportPhoto } from "@/lib/api/community";
import { blobToDataUrl } from "@/lib/files";

export function useCommunityReportPhoto(reportId: number | null, hasPhoto: boolean, parkId?: number) {
  const photo = useQuery({
    queryKey: ["community-report-photo", reportId, parkId],
    queryFn: () => fetchCommunityReportPhoto(reportId as number, parkId).then(blobToDataUrl),
    enabled: reportId !== null && hasPhoto,
    staleTime: Infinity,
  });
  return {
    photoUrl: photo.data ?? null,
    photoLoading: photo.isLoading,
    photoError: photo.isError,
  };
}
