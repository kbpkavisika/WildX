import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommunityReports,
  fetchHotspots,
  fetchSmsHelpCard,
  invalidateReport,
  updateReportLocation,
  validateReport,
} from "@/lib/api/community";
import { useAuthStore } from "@/lib/auth/store";

export function useCommunityReports(status?: string) {
  const queryClient = useQueryClient();
  const signedIn = useAuthStore((state) => state.token !== null);

  const reports = useQuery({
    queryKey: ["community-reports", status ?? "ALL"],
    queryFn: () => fetchCommunityReports(status),
    refetchInterval: 15_000,
    enabled: signedIn,
  });

  const hotspots = useQuery({
    queryKey: ["community-hotspots"],
    queryFn: () => fetchHotspots(),
    refetchInterval: 30_000,
    enabled: signedIn,
  });

  const validate = useMutation({
    mutationFn: ({ id, severity }: { id: number; severity: string }) => validateReport(id, severity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
      queryClient.invalidateQueries({ queryKey: ["community-hotspots"] });
    },
  });

  const invalidate = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => invalidateReport(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
    },
  });

  const updateLocation = useMutation({
    mutationFn: ({
      id,
      segmentId,
      landmarkCode,
      lat,
      lng,
    }: {
      id: number;
      segmentId: number;
      landmarkCode?: string;
      lat?: number;
      lng?: number;
    }) => updateReportLocation(id, { segmentId, landmarkCode, lat, lng }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
    },
  });

  return {
    reports,
    hotspots,
    validate,
    invalidate,
    updateLocation,
  };
}

export function useSmsHelpCardQuery() {
  const signedIn = useAuthStore((state) => state.token !== null);
  return useQuery({
    queryKey: ["sms-help-card"],
    queryFn: () => fetchSmsHelpCard(),
    enabled: signedIn,
  });
}
