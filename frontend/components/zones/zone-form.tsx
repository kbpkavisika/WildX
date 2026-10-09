"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BoundaryField } from "@/components/forms/boundary-field";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { ZONE_TYPE_LABELS } from "@/lib/zones/labels";
import { useZonesPage } from "@/lib/zones/store";
import { parseBoundary, zoneFormSchema, type ZoneFormValues } from "@/lib/zones/zone-form";

interface ZoneFormProps {
  defaultValues: ZoneFormValues;
  submitLabel: string;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: ZoneFormValues) => void;
  onClose: () => void;
}

export function ZoneForm({ defaultValues, submitLabel, saving, error, onSubmit, onClose }: ZoneFormProps) {
  const setDraft = useZonesPage((state) => state.setDraft);
  const { register, handleSubmit, control, formState: { errors } } = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues,
  });
  const boundary = useWatch({ control, name: "boundary" });

  useEffect(() => {
    setDraft(parseBoundary(boundary));
  }, [boundary, setDraft]);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Kumbukgaha farmland" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
        </Field>
        <Field label="Type">
          <select {...register("type")} className={fieldClass(false)}>
            {Object.entries(ZONE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <div className="col-span-full">
          <BoundaryField
            registration={register("boundary")}
            error={errors.boundary?.message}
            caption="Longitude, latitude pairs. The last corner repeats the first. The outline shows on the map as you type."
          />
        </div>
      </div>
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
