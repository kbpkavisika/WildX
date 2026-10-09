import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagCameraImage } from "@/lib/api/camera-images";
import { useAuthStore } from "@/lib/auth/store";
import { toTagRequest, type TagRequestValues } from "@/lib/camera/tag-form";
import { CAMERA_IMAGE_STATUSES } from "@/lib/enums";

export function useTagImage() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  return useMutation({
    mutationFn: ({ imageId, values }: { imageId: number; values: TagRequestValues }) =>
      tagCameraImage(parkId as number, imageId, toTagRequest(values)),
    onSuccess: (image) => {
      if (image.status === CAMERA_IMAGE_STATUSES.RESTRICTED) queryClient.removeQueries({ queryKey: ["camera-image", parkId, image.id] });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["parks", parkId, "camera-images"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
      ]);
    },
  });
}
