"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BoundaryField } from "@/components/forms/boundary-field";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { sectorFormSchema, type SectorFormValues } from "@/lib/parks/forms";

interface SectorFormProps {
  defaultValues: SectorFormValues;
  submitLabel: string;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: SectorFormValues) => void;
  onClose: () => void;
}

export function SectorForm({ defaultValues, submitLabel, saving, error, onSubmit, onClose }: SectorFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SectorFormValues>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues,
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Name" error={errors.name?.message}>
        <input {...register("name")} placeholder="e.g. Sector 4B" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
      </Field>
      <BoundaryField
        registration={register("boundary")}
        error={errors.boundary?.message}
        caption="Longitude, latitude pairs. The last corner repeats the first."
      />
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
