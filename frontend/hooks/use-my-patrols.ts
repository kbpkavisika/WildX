import { useQuery } from "@tanstack/react-query";
import { fetchMyPatrols } from "@/lib/api/patrols";
import { useAuthStore } from "@/lib/auth/store";
import { LIVE_PATROLS_REFETCH_MS } from "@/lib/constants";

export const MY_PATROLS_KEY = ["patrols", "me"];

export function useMyPatrols() {
  const signedIn = useAuthStore((state) => state.token !== null);
  return useQuery({
    queryKey: MY_PATROLS_KEY,
    queryFn: fetchMyPatrols,
    refetchInterval: LIVE_PATROLS_REFETCH_MS,
    enabled: signedIn,
  });
}
