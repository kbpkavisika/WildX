"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, QuietButton, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useNewPatrol } from "@/hooks/use-new-patrol";
import { emptyNewPatrol, newPatrolSchema, type NewPatrolValues } from "@/lib/patrols/new-patrol-form";

export function NewPatrolForm({ onClose }: { onClose: () => void }) {
  const { routes, rangers, assign } = useNewPatrol(onClose);
  const { register, handleSubmit, formState: { errors } } = useForm<NewPatrolValues>({
    resolver: zodResolver(newPatrolSchema),
    defaultValues: emptyNewPatrol(new Date()),
  });

  return (
    <section aria-label="New patrol" className="flex flex-col gap-5 rounded-[14px] bg-surface-form p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-form-title">New patrol</h2>
        <QuietButton type="button" aria-label="Close" onClick={onClose} className="px-0">
          <X />
        </QuietButton>
      </div>
      <form noValidate onSubmit={handleSubmit((values) => assign.mutate(values))} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Route" error={errors.routeId?.message}>
            <select {...register("routeId")} aria-invalid={!!errors.routeId} className={fieldClass(!!errors.routeId)}>
              <option value="">Choose a route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Ranger" error={errors.rangerId?.message}>
            <select {...register("rangerId")} aria-invalid={!!errors.rangerId} className={fieldClass(!!errors.rangerId)}>
              <option value="">Choose a ranger</option>
              {rangers.map((ranger) => (
                <option key={ranger.id} value={ranger.id}>{ranger.name}</option>
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
        {assign.isError && <p role="alert" className="m-0 text-body text-negative">{assign.error.message}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={assign.isPending} className="h-10 px-[18px] disabled:opacity-60">
            {assign.isPending ? "Creating…" : "Create patrol"}
          </Button>
        </div>
      </form>
    </section>
  );
}
