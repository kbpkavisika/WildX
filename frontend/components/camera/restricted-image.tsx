"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useRestrictedImage } from "@/hooks/use-restricted-image";
import { EMPTY_REASON, reasonSchema, type ReasonValues } from "@/lib/camera/reason-form";
import { ImageFrame, ImagePicture } from "./image-picture";

export function RestrictedImage({ imageId, title }: { imageId: number; title: string }) {
  const open = useRestrictedImage(imageId);
  const { register, handleSubmit, formState: { errors } } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: EMPTY_REASON,
  });

  if (open.data) {
    return (
      <ImageFrame>
        <ImagePicture src={open.data} restricted={false} alt={title} large />
      </ImageFrame>
    );
  }

  return (
    <>
      <ImageFrame>
        <ImagePicture src={undefined} restricted alt={title} large />
      </ImageFrame>
      <form
        noValidate
        aria-label="View restricted image"
        onSubmit={handleSubmit((values) => open.mutate(values.reason))}
        className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
      >
        <span className="text-form-title">View restricted image</span>
        <p className="m-0 text-body text-ink-body">Every view is written to the audit log with your name, the time and this reason.</p>
        <Field label="Reason" error={errors.reason?.message}>
          <input {...register("reason")} placeholder="e.g. Case 114 evidence review" aria-invalid={!!errors.reason} className={fieldClass(!!errors.reason)} />
        </Field>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {open.isError && <p role="alert" className="m-0 mr-auto text-body text-negative">Could not open the image. Try again.</p>}
          <Button type="submit" disabled={open.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {open.isPending ? "Opening…" : "View image"}
          </Button>
        </div>
      </form>
    </>
  );
}
