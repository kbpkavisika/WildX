"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChoiceRow } from "@/components/forms/choice-row";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useTagImage } from "@/hooks/use-tag-image";
import { apiErrorMessage } from "@/lib/api/client";
import { isAnimals, TAG_OPTIONS, tagSchema, type TagRequestValues, type TagValues } from "@/lib/camera/tag-form";
import { cn } from "@/lib/utils";

const STATUS_ERROR_ID = "tag-status-error";

export function TagImageForm({ imageId, defaults }: { imageId: number; defaults: TagValues }) {
  const tag = useTagImage();
  const { register, handleSubmit, control, formState: { errors } } = useForm<TagValues, unknown, TagRequestValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: defaults,
  });
  const status = useWatch({ control, name: "status" });
  const mine = tag.variables?.imageId === imageId;

  return (
    <form
      noValidate
      aria-label="Tag image"
      onSubmit={handleSubmit((values) => tag.mutate({ imageId, values }))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
    >
      <span className="text-form-title">Tag image</span>
      <fieldset aria-describedby={errors.status ? STATUS_ERROR_ID : undefined} className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 p-0 text-field-label text-ink-body">What is in the image?</legend>
        <div className={cn("flex flex-col gap-2", errors.status && "rounded-md outline outline-negative")}>
          {TAG_OPTIONS.map((option) => (
            <ChoiceRow key={option.value} label={option.label} caption={option.caption} value={option.value} {...register("status")} />
          ))}
        </div>
        {errors.status && <span id={STATUS_ERROR_ID} className="text-caption text-negative">{errors.status.message}</span>}
      </fieldset>
      {isAnimals(status) && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          <Field label="Species" error={errors.species?.message}>
            <input {...register("species")} placeholder="e.g. Asian elephant" aria-invalid={!!errors.species} className={fieldClass(!!errors.species)} />
          </Field>
          <Field label="Count" error={errors.animalCount?.message}>
            <input {...register("animalCount")} inputMode="numeric" placeholder="e.g. 2" aria-invalid={!!errors.animalCount} className={fieldClass(!!errors.animalCount)} />
          </Field>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {mine && tag.isError && <p role="alert" className="m-0 mr-auto text-body text-negative">{apiErrorMessage(tag.error)}</p>}
        {mine && tag.isSuccess && <p role="status" className="m-0 mr-auto text-body text-positive">Saved.</p>}
        <Button type="submit" disabled={tag.isPending} className="h-10 px-[18px] disabled:opacity-60">
          {tag.isPending ? "Saving…" : "Save tag"}
        </Button>
      </div>
    </form>
  );
}
