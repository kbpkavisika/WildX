import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchCameraBursts, fetchCameraImageFile } from "@/lib/api/camera-images";
import { useAuthStore } from "@/lib/auth/store";
import { toCameraView } from "@/lib/camera/mappers";
import { canViewCameraImages } from "@/lib/camera/roles";
import { useCameraPage } from "@/lib/camera/store";
import { CAMERA_FILTERS } from "@/lib/camera/types";
import { CAMERA_IMAGES_REFETCH_MS } from "@/lib/constants";
import { ROLES } from "@/lib/enums";
import { blobToDataUrl } from "@/lib/files";

export function useCameraImages() {
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const role = useAuthStore((state) => state.user?.role ?? null);
  const filter = useCameraPage((state) => state.filter);
  const selectedId = useCameraPage((state) => state.selectedId);
  const canView = canViewCameraImages(role);
  const restrictedOnly = role === ROLES.LEL;

  const bursts = useQuery({
    queryKey: ["parks", parkId, "camera-images"],
    queryFn: () => fetchCameraBursts(parkId as number),
    refetchInterval: CAMERA_IMAGES_REFETCH_MS,
    enabled: parkId !== null && canView,
  });

  const view = bursts.data && toCameraView(bursts.data, restrictedOnly ? CAMERA_FILTERS.RESTRICTED : filter, selectedId, new Date());
  const tileIds = (view?.bursts ?? []).flatMap((burst) => burst.tiles.filter((tile) => !tile.restricted).map((tile) => tile.id));
  const selected = view?.selected;
  const visibleIds = [...new Set(selected && !selected.restricted ? [...tileIds, selected.id] : tileIds)];

  const pictures = useQueries({
    queries: visibleIds.map((imageId) => ({
      queryKey: ["camera-image", parkId, imageId],
      queryFn: () => fetchCameraImageFile(parkId as number, imageId).then(blobToDataUrl),
      staleTime: Infinity,
    })),
    combine: (results) => new Map(visibleIds.flatMap((imageId, index): [number, string][] => (results[index]?.data ? [[imageId, results[index].data]] : []))),
  });

  return {
    parkId,
    canView,
    restrictedOnly,
    canTag: role === ROLES.MANAGER,
    isPending: bursts.isPending,
    isError: bursts.isError,
    view,
    pictures,
  };
}
