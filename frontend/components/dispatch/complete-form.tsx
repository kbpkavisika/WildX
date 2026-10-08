"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { completeSchema, DISPATCH_OUTCOMES, EMPTY_COMPLETE, toOutcomeText, type CompleteValues } from "@/lib/dispatch/task-forms";
import { cn } from "@/lib/utils";

const LARGE = "h-12";

interface CompleteFormProps {
  saving: boolean;
  error: Error | null;
  onSubmit: (outcome: string) => void;
  onCancel: () => void;
}

export function CompleteForm({ saving, error, onSubmit, onCancel }: CompleteFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: EMPTY_COMPLETE,
  });

  return (
    <form
      noValidate
      aria-label="Complete dispatch"
      onSubmit={handleSubmit((values) => onSubmit(toOutcomeText(values)))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-4"
    >
      <Field label="Outcome" error={errors.outcome?.message}>
        <select {...register("outcome")} aria-invalid={!!errors.outcome} className={cn(fieldClass(!!errors.outcome), LARGE)}>
          <option value="">Choose an outcome</option>
          {DISPATCH_OUTCOMES.map((outcome) => (
            <option key={outcome} value={outcome}>{outcome}</option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)" error={errors.note?.message}>
        <textarea
          {...register("note")}
          rows={3}
          placeholder="e.g. Removed 3 snares, handed wire to station"
          aria-invalid={!!errors.note}
          className={cn(fieldClass(!!errors.note), "h-auto py-2.5")}
        />
      </Field>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <Button type="submit" disabled={saving} className="w-full justify-center disabled:opacity-60">
        {saving ? "Completing…" : "Complete"}
      </Button>
      <SecondaryButton onClick={onCancel} className={cn(LARGE, "w-full justify-center")}>Cancel</SecondaryButton>
    </form>
  );
}
