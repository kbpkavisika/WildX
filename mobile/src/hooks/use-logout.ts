import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/store";
import { stopTracking } from "@/lib/tracking/task";

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    void stopTracking();
    useSession.getState().clearSession();
    queryClient.clear();
  };
}
