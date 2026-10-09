import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDevice, fetchAnimals } from "@/lib/api/devices";
import { useAuthStore } from "@/lib/auth/store";
import { toDeviceRequest, type DeviceFormValues } from "@/lib/devices/device-form";

export function useNewDevice(onCreated: () => void) {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  const animals = useQuery({
    queryKey: ["parks", parkId, "animals"],
    queryFn: () => fetchAnimals(parkId as number),
    enabled: parkId !== null,
  });

  const create = useMutation({
    mutationFn: (values: DeviceFormValues) => createDevice(parkId as number, toDeviceRequest(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["parks", parkId, "devices"] });
      onCreated();
    },
  });

  return { animals: animals.data ?? [], create };
}
