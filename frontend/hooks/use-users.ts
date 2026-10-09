import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, deactivateUser, fetchParks, fetchUsers, updateUser } from "@/lib/api/users";
import { useAuthStore } from "@/lib/auth/store";
import { ROLES } from "@/lib/enums";
import { toUsersView } from "@/lib/users/mappers";
import { toUserRequest, type UserValues } from "@/lib/users/user-form";

const USERS_KEY = ["admin", "users"];
const PARKS_KEY = ["admin", "parks"];

interface SaveInput {
  userId: number | null;
  values: UserValues;
}

export function useUsers() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === ROLES.ADMIN;
  const users = useQuery({ queryKey: USERS_KEY, queryFn: fetchUsers, enabled: isAdmin });
  const parks = useQuery({ queryKey: PARKS_KEY, queryFn: fetchParks, enabled: isAdmin });

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
    isAdmin,
    isPending: users.isPending,
    isError: users.isError,
    users: users.data ?? [],
    parks: parks.data ?? [],
    view: users.data && toUsersView(users.data, user?.id ?? null),
    save,
    remove,
  };
}
