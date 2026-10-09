import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPark, fetchParks, switchPark } from "@/lib/api/parks";
import { useAuthStore } from "@/lib/auth/store";
import { toParkRequest, type ParkFormValues } from "@/lib/parks/forms";

export function useParks() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const setSession = useAuthStore((state) => state.setSession);

  const parks = useQuery({ queryKey: ["parks", "mine"], queryFn: fetchParks, enabled: token !== null });

  const switchTo = useMutation({
    mutationFn: switchPark,
    onSuccess: (user) => {
      if (token) setSession(token, user);
      queryClient.clear();
    },
  });

  const create = useMutation({
    mutationFn: (values: ParkFormValues) => createPark(toParkRequest(values)),
    onSuccess: (park) => {
      const user = useAuthStore.getState().user;
      if (token && user) setSession(token, { ...user, parkId: park.id });
      queryClient.clear();
    },
  });

  const list = parks.data ?? [];
  return {
    parks: list,
    current: list.find((park) => park.id === parkId) ?? null,
    isPending: parks.isPending,
    isError: parks.isError,
    switchTo,
    create,
  };
}
