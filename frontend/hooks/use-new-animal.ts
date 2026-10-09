import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnimal } from "@/lib/api/devices";
import { useAuthStore } from "@/lib/auth/store";
import { toAnimalRequest, type AnimalFormValues } from "@/lib/devices/device-form";

export function useNewAnimal(onCreated: () => void) {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  const create = useMutation({
    mutationFn: (values: AnimalFormValues) => createAnimal(parkId as number, toAnimalRequest(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["parks", parkId, "animals"] });
      onCreated();
    },
  });

  return { create };
}
