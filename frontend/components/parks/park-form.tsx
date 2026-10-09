"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { EMPTY_PARK, parkFormSchema, type ParkFormValues } from "@/lib/parks/forms";

interface ParkFormProps {
  saving: boolean;
  error: Error | null;
  onSubmit: (values: ParkFormValues) => void;
  onClose: () => void;
}

export function ParkForm({ saving, error, onSubmit, onClose }: ParkFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ParkFormValues>({
    resolver: zodResolver(parkFormSchema),
    defaultValues: EMPTY_PARK,
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Wilpattu" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
        </Field>
        <Field label="Code" error={errors.code?.message}>
          <input {...register("code")} placeholder="e.g. WIL" aria-invalid={!!errors.code} className={fieldClass(!!errors.code)} />
        </Field>
      </div>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
          {saving ? "Saving…" : "Create park"}
        </Button>
      </div>
    </form>
  );
}
