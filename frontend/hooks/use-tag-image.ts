import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagCameraImage } from "@/lib/api/camera-images";
import { useAuthStore } from "@/lib/auth/store";
import { toTagRequest, type TagRequestValues } from "@/lib/camera/tag-form";

export function useTagImage() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);

  return useMutation({
    mutationFn: ({ imageId, values }: { imageId: number; values: TagRequestValues }) =>
      tagCameraImage(parkId as number, imageId, toTagRequest(values)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["parks", parkId, "camera-images"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
      ]),
  });
}
