import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDevices } from "@/lib/api/devices";
import { simulateCameraImages, simulateCollarFixes } from "@/lib/api/simulator";
import { fetchZones } from "@/lib/api/zones";
import { useCan } from "@/hooks/use-can";
import { useAuthStore } from "@/lib/auth/store";
import {
  toCameraSimulationRequest,
  toCollarSimulationRequest,
  type CameraSimulationValues,
  type CollarSimulationValues,
} from "@/lib/simulator/forms";
import { toCameraOptions, toCollarOptions, toZoneOptions } from "@/lib/simulator/mappers";

export function useSimulator() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const canSimulate = useCan("simulator.use");
  const enabled = parkId !== null && canSimulate;

  const devices = useQuery({
    queryKey: ["parks", parkId, "devices"],
    queryFn: () => fetchDevices(parkId as number),
    enabled,
  });

  const zones = useQuery({
    queryKey: ["parks", parkId, "zones"],
    queryFn: () => fetchZones(parkId as number),
    enabled,
  });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["alerts"] }),
    queryClient.invalidateQueries({ queryKey: ["parks", parkId, "devices"] }),
  ]);

  const collar = useMutation({
    mutationFn: (values: CollarSimulationValues) => simulateCollarFixes(parkId as number, toCollarSimulationRequest(values)),
    onSuccess: refresh,
  });

  const camera = useMutation({
    mutationFn: (values: CameraSimulationValues) => simulateCameraImages(parkId as number, toCameraSimulationRequest(values)),
    onSuccess: refresh,
  });

  const all = devices.data ?? [];
  return {
    parkId,
    canSimulate,
    collars: toCollarOptions(all),
    cameras: toCameraOptions(all),
    zones: toZoneOptions(zones.data ?? []),
    collar,
    camera,
  };
}
