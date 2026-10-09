import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, deactivateUser, fetchUsers, updateUser } from "@/lib/api/users";
import { useCan } from "@/hooks/use-can";
import { useAuthStore } from "@/lib/auth/store";
import { toUsersView } from "@/lib/users/mappers";
import { toUserRequest, type UserValues } from "@/lib/users/user-form";

const USERS_KEY = ["users"];

interface SaveInput {
  userId: number | null;
  values: UserValues;
}

export function useUsers() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = useCan("user.manage");
  const users = useQuery({ queryKey: USERS_KEY, queryFn: fetchUsers, enabled: canManage });

  const refresh = () => queryClient.invalidateQueries({ queryKey: USERS_KEY });

  const save = useMutation({
    mutationFn: ({ userId, values }: SaveInput) => {
      const request = toUserRequest(values);
      return userId === null ? createUser(request) : updateUser(userId, request);
    },
    onSuccess: refresh,
  });

  const remove = useMutation({ mutationFn: deactivateUser, onSuccess: refresh });

  return {
    canManage,
    isPending: users.isPending,
    isError: users.isError,
    users: users.data ?? [],
    view: users.data && toUsersView(users.data, user?.id ?? null),
    save,
    remove,
  };
}
