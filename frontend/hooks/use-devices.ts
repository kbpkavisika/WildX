import { useQuery } from "@tanstack/react-query";
import { fetchDevices } from "@/lib/api/devices";
import { useCan } from "@/hooks/use-can";
import { useAuthStore } from "@/lib/auth/store";
import { DEVICES_REFETCH_MS } from "@/lib/constants";
import { toDevicesView } from "@/lib/devices/mappers";
import { useDevicesPage } from "@/lib/devices/store";

export function useDevices() {
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const canManage = useCan("device.manage");
  const filter = useDevicesPage((state) => state.filter);

  const devices = useQuery({
    queryKey: ["parks", parkId, "devices"],
    queryFn: () => fetchDevices(parkId as number),
    refetchInterval: DEVICES_REFETCH_MS,
    enabled: parkId !== null,
  });

  return {
    parkId,
    canManage,
    isPending: devices.isPending,
    isError: devices.isError,
    view: devices.data && toDevicesView(devices.data, filter, new Date()),
  };
}
