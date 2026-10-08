import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/store";
import { homePath } from "@/lib/auth/routes";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setSession(token, user);
      router.replace(homePath(user.role));
    },
  });
}
