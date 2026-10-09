"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useNewAnimal } from "@/hooks/use-new-animal";
import { apiErrorMessage } from "@/lib/api/client";
import { animalFormSchema, EMPTY_ANIMAL, type AnimalFormValues } from "@/lib/devices/device-form";

export function AnimalForm({ onClose }: { onClose: () => void }) {
  const { create } = useNewAnimal(onClose);
  const { register, handleSubmit, formState: { errors } } = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: EMPTY_ANIMAL,
  });

  return (
    <form noValidate onSubmit={handleSubmit((values) => create.mutate(values))} className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Gemunu" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
        </Field>
        <Field label="Species" error={errors.species?.message}>
          <input {...register("species")} placeholder="e.g. Asian elephant" aria-invalid={!!errors.species} className={fieldClass(!!errors.species)} />
        </Field>
      </div>
      {create.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(create.error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <Button type="submit" disabled={create.isPending} className="h-10 px-[18px] disabled:opacity-60">
          {create.isPending ? "Adding…" : "Add animal"}
        </Button>
      </div>
    </form>
  );
}
