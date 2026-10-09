"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Button, QuietButton, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useNewPatrol } from "@/hooks/use-new-patrol";
import { createPatrolLabel, emptyNewPatrol, newPatrolSchema, type NewPatrolValues } from "@/lib/patrols/new-patrol-form";
import { cn } from "@/lib/utils";

export function NewPatrolForm({ onClose }: { onClose: () => void }) {
  const { routes, rangers, assign } = useNewPatrol(onClose);
  const { register, handleSubmit, control, formState: { errors } } = useForm<NewPatrolValues>({
    resolver: zodResolver(newPatrolSchema),
    defaultValues: emptyNewPatrol(new Date()),
  });
  const rangerCount = useWatch({ control, name: "rangerIds" }).length;

  return (
    <section aria-label="New patrol" className="flex flex-col gap-5 rounded-[14px] bg-surface-form p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-form-title">New patrol</h2>
        <QuietButton type="button" aria-label="Close" onClick={onClose} className="px-0">
          <X />
        </QuietButton>
      </div>
      <form noValidate onSubmit={handleSubmit((values) => assign.mutate(values))} className="flex flex-col gap-5">
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
        {assign.isError && <p role="alert" className="m-0 text-body text-negative">{assign.error.message}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={assign.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {assign.isPending ? "Creating…" : createPatrolLabel(rangerCount)}
          </Button>
        </div>
      </form>
    </section>
  );
}
