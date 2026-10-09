import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/api/auth";
import { useSession } from "@/lib/auth/store";
import { NotRangerError, type SignInValues } from "@/lib/auth/sign-in-form";
import { ROLES } from "@/lib/enums";
import { refreshOutbox } from "@/lib/outbox/store";

export function useLogin() {
  const setSession = useSession((state) => state.setSession);
  return useMutation({
    mutationFn: async ({ email, password }: SignInValues) => {
      const response = await login({ email, password });
      if (response.user.role !== ROLES.RANGER) throw new NotRangerError();
      return response;
    },
    onSuccess: ({ token, user }, { remember }) => {
      setSession(token, user, remember);
      refreshOutbox();
    },
  });
}
