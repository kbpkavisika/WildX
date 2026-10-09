"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useSavePatrol } from "@/hooks/use-save-patrol";
import { apiErrorMessage } from "@/lib/api/client";
import type { PatrolResponse } from "@/lib/api/patrols";
import { createPatrolLabel, emptyPatrol, patrolFormSchema, toPatrolValues, type PatrolFormValues } from "@/lib/patrols/patrol-form";
import { cn } from "@/lib/utils";

interface PatrolFormProps {
  patrol: PatrolResponse | null;
  onClose: () => void;
}

export function PatrolForm({ patrol, onClose }: PatrolFormProps) {
  const { routes, rangers, save } = useSavePatrol(patrol?.id ?? null, onClose);
  const { register, handleSubmit, control, formState: { errors } } = useForm<PatrolFormValues>({
    resolver: zodResolver(patrolFormSchema),
    defaultValues: patrol ? toPatrolValues(patrol) : emptyPatrol(new Date()),
  });
  const rangerCount = useWatch({ control, name: "rangerIds" }).length;

  return (
    <Modal title={patrol ? `Edit PT-${patrol.id}` : "New patrol"} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Route" error={errors.routeId?.message}>
            <select {...register("routeId")} aria-invalid={!!errors.routeId} className={fieldClass(!!errors.routeId)}>
              <option value="">Choose a route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date" error={errors.scheduledDate?.message}>
            <input
              type="date"
              {...register("scheduledDate")}
              aria-invalid={!!errors.scheduledDate}
              className={fieldClass(!!errors.scheduledDate)}
            />
          </Field>
        </div>
        {patrol ? (
          <Field label="Ranger" error={errors.rangerIds?.message}>
            <Controller
              control={control}
              name="rangerIds"
              render={({ field }) => (
                <select
                  value={field.value[0] ?? ""}
                  onChange={(event) => field.onChange(event.target.value ? [event.target.value] : [])}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.rangerIds}
                  className={fieldClass(!!errors.rangerIds)}
                >
                  <option value="">Choose a ranger</option>
                  {rangers.map((ranger) => (
                    <option key={ranger.id} value={ranger.id}>{ranger.name}</option>
                  ))}
                </select>
              )}
            />
          </Field>
        ) : (
          <fieldset aria-invalid={!!errors.rangerIds} className="m-0 flex flex-col gap-1.5 border-0 p-0">
            <legend className="mb-1.5 p-0 text-field-label text-ink-body">Rangers</legend>
            <div
              className={cn(
                "flex flex-wrap gap-x-5 gap-y-1 rounded-md border bg-card px-3 py-1",
                errors.rangerIds ? "border-negative" : "border-line-strong",
              )}
            >
              {rangers.length === 0 && <span className="py-2 text-body text-ink-muted">No active rangers in this park.</span>}
              {rangers.map((ranger) => (
                <label key={ranger.id} className="flex min-h-10 items-center gap-2 text-body text-ink-body">
                  <input type="checkbox" value={ranger.id} {...register("rangerIds")} className="m-0 size-4 accent-primary" />
                  {ranger.name}
                </label>
              ))}
            </div>
            {errors.rangerIds && <span className="text-caption text-negative">{errors.rangerIds.message}</span>}
          </fieldset>
        )}
        {save.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(save.error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={save.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {save.isPending ? "Saving…" : patrol ? "Save changes" : createPatrolLabel(rangerCount)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
