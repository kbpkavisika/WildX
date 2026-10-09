import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { LOGIN_PATH } from "@/lib/auth/routes";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  return () => {
    clearSession();
    queryClient.clear();
    router.replace(LOGIN_PATH);
  };
}
