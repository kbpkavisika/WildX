"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { dismissSchema, EMPTY_DISMISS, type DismissValues } from "@/lib/incidents/dismiss-form";
import { cn } from "@/lib/utils";

interface DismissFormProps {
  saving: boolean;
  error: Error | null;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export function DismissForm({ saving, error, onSubmit, onCancel }: DismissFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<DismissValues>({
    resolver: zodResolver(dismissSchema),
    defaultValues: EMPTY_DISMISS,
  });

  return (
    <form
      noValidate
      aria-label="Dismiss incident"
      onSubmit={handleSubmit((values) => onSubmit(values.reason))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
    >
      <Field label="Reason for dismissing" error={errors.reason?.message}>
        <textarea
          {...register("reason")}
          rows={3}
          placeholder="e.g. Old snare already removed last week"
          aria-invalid={!!errors.reason}
          className={cn(fieldClass(!!errors.reason), "h-auto py-2.5")}
        />
      </Field>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
          {saving ? "Dismissing…" : "Dismiss incident"}
        </Button>
      </div>
    </form>
  );
}
