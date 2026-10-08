"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, QuietButton, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import {
  incidentTypeErrorMessage,
  incidentTypeSchema,
  type IncidentTypeRequestValues,
  type IncidentTypeValues,
} from "@/lib/incidents/incident-type-form";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";

interface IncidentTypeFormProps {
  title: string;
  submitLabel: string;
  defaultValues: IncidentTypeValues;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: IncidentTypeRequestValues) => void;
  onClose: () => void;
}

export function IncidentTypeForm({ title, submitLabel, defaultValues, saving, error, onSubmit, onClose }: IncidentTypeFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<IncidentTypeValues, unknown, IncidentTypeRequestValues>({
    resolver: zodResolver(incidentTypeSchema),
    defaultValues,
  });

  return (
    <section aria-label={title} className="flex flex-col gap-5 rounded-[14px] bg-surface-form p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-form-title">{title}</h2>
        <QuietButton type="button" aria-label="Close" onClick={onClose} className="px-0">
          <X />
        </QuietButton>
      </div>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="e.g. Snare"
              aria-invalid={!!errors.name}
              className={fieldClass(!!errors.name)}
            />
          </Field>
          <Field label="Default severity" error={errors.defaultSeverity?.message}>
            <select {...register("defaultSeverity")} aria-invalid={!!errors.defaultSeverity} className={fieldClass(!!errors.defaultSeverity)}>
              <option value="">Choose a severity</option>
              {Object.entries(SEVERITY_DISPLAY).map(([value, display]) => (
                <option key={value} value={value}>{display.label}</option>
              ))}
            </select>
          </Field>
          <label className="flex min-h-12 items-center gap-2 self-end text-body text-ink-body">
            <input type="checkbox" {...register("active")} className="m-0 size-4 accent-primary" />
            Active · rangers can pick it
          </label>
        </div>
        {error && <p role="alert" className="m-0 text-body text-negative">{incidentTypeErrorMessage(error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </section>
  );
}
