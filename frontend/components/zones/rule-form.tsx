"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";
import { ruleFormSchema, type RuleFormValues } from "@/lib/zones/rule-form";

interface RuleFormProps {
  title: string;
  defaultValues: RuleFormValues;
  canRemove: boolean;
  busy: boolean;
  error: Error | null;
  onSubmit: (values: RuleFormValues) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function RuleForm({ title, defaultValues, canRemove, busy, error, onSubmit, onRemove, onClose }: RuleFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues,
  });

  return (
    <form
      noValidate
      aria-label={title}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
    >
      <h3 className="m-0 text-form-title">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Field label="Severity">
          <select {...register("severity")} className={fieldClass(false)}>
            {Object.entries(SEVERITY_DISPLAY).map(([value, display]) => (
              <option key={value} value={value}>{display.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Cool-down (minutes)" error={errors.cooldownMin?.message}>
          <input {...register("cooldownMin")} inputMode="numeric" aria-invalid={!!errors.cooldownMin} className={fieldClass(!!errors.cooldownMin)} />
          {!errors.cooldownMin && <span className="text-caption font-normal text-ink-muted">0 to 1440. 0 raises an alert for every breach.</span>}
        </Field>
        <Field label="Acknowledge within (minutes)" error={errors.ackSlaMin?.message}>
          <input {...register("ackSlaMin")} inputMode="numeric" aria-invalid={!!errors.ackSlaMin} className={fieldClass(!!errors.ackSlaMin)} />
        </Field>
      </div>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        {canRemove && (
          <SecondaryButton type="button" onClick={onRemove} disabled={busy} className="mr-auto text-negative disabled:opacity-60">
            Remove rule
          </SecondaryButton>
        )}
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <Button type="submit" disabled={busy} className="h-10 px-[18px] disabled:opacity-60">
          {busy ? "Saving…" : "Save rule"}
        </Button>
      </div>
    </form>
  );
}
