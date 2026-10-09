"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useNewDevice } from "@/hooks/use-new-device";
import { apiErrorMessage } from "@/lib/api/client";
import { deviceFormSchema, EMPTY_DEVICE, type DeviceFormValues } from "@/lib/devices/device-form";
import { DEVICE_TYPES } from "@/lib/enums";

export function DeviceForm({ onClose }: { onClose: () => void }) {
  const { animals, create } = useNewDevice(onClose);
  const { register, handleSubmit, control, formState: { errors } } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: EMPTY_DEVICE,
  });
  const type = useWatch({ control, name: "type" });

  return (
    <form noValidate onSubmit={handleSubmit((values) => create.mutate(values))} className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Type">
          <select {...register("type")} className={fieldClass(false)}>
            <option value={DEVICE_TYPES.COLLAR}>Collar</option>
            <option value={DEVICE_TYPES.CAMERA}>Camera</option>
          </select>
        </Field>
        <Field label="Code" error={errors.code?.message}>
          <input {...register("code")} placeholder="e.g. COL-004" aria-invalid={!!errors.code} className={fieldClass(!!errors.code)} />
        </Field>
        <Field label="Reports every (minutes)" error={errors.expectedIntervalMin?.message}>
          <input
            {...register("expectedIntervalMin")}
            inputMode="numeric"
            aria-invalid={!!errors.expectedIntervalMin}
            className={fieldClass(!!errors.expectedIntervalMin)}
          />
        </Field>
        {type === DEVICE_TYPES.COLLAR ? (
          <Field label="Animal" error={errors.animalId?.message}>
            <select {...register("animalId")} aria-invalid={!!errors.animalId} className={fieldClass(!!errors.animalId)}>
              <option value="">Choose an animal</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>{`${animal.name} · ${animal.species}`}</option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Latitude" error={errors.lat?.message}>
              <input {...register("lat")} inputMode="decimal" placeholder="e.g. 6.3100" aria-invalid={!!errors.lat} className={fieldClass(!!errors.lat)} />
            </Field>
            <Field label="Longitude" error={errors.lng?.message}>
              <input {...register("lng")} inputMode="decimal" placeholder="e.g. 81.4100" aria-invalid={!!errors.lng} className={fieldClass(!!errors.lng)} />
            </Field>
          </>
        )}
      </div>
      {type === DEVICE_TYPES.COLLAR && animals.length === 0 && (
        <p className="m-0 text-caption text-ink-muted">No animals yet. Add one with New animal first.</p>
      )}
      {create.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(create.error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <Button type="submit" disabled={create.isPending} className="h-10 px-[18px] disabled:opacity-60">
          {create.isPending ? "Registering…" : "Register device"}
        </Button>
      </div>
    </form>
  );
}
