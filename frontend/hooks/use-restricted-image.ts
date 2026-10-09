import { useMutation } from "@tanstack/react-query";
import { fetchRestrictedImageFile } from "@/lib/api/camera-images";
import { useAuthStore } from "@/lib/auth/store";
import { blobToDataUrl } from "@/lib/files";

export function useRestrictedImage(imageId: number) {
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  return useMutation({
    mutationFn: (reason: string) => fetchRestrictedImageFile(parkId as number, imageId, reason).then(blobToDataUrl),
  });
}
