"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { declineSchema, EMPTY_DECLINE, type DeclineValues } from "@/lib/dispatch/task-forms";
import { cn } from "@/lib/utils";

interface DeclineFormProps {
  saving: boolean;
  error: Error | null;
  onSubmit: (reason: string | null) => void;
  onCancel: () => void;
}

export function DeclineForm({ saving, error, onSubmit, onCancel }: DeclineFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<DeclineValues>({
    resolver: zodResolver(declineSchema),
    defaultValues: EMPTY_DECLINE,
  });

  return (
    <form
      noValidate
      aria-label="Decline dispatch"
      onSubmit={handleSubmit((values) => onSubmit(values.reason === "" ? null : values.reason))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-4"
    >
      <Field label="Reason (optional)" error={errors.reason?.message}>
        <textarea
          {...register("reason")}
          rows={3}
          placeholder="e.g. Already responding to another call"
          aria-invalid={!!errors.reason}
          className={cn(fieldClass(!!errors.reason), "h-auto py-2.5")}
        />
      </Field>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <Button type="submit" disabled={saving} className="w-full justify-center disabled:opacity-60">
        {saving ? "Declining…" : "Decline dispatch"}
      </Button>
      <SecondaryButton onClick={onCancel} className="h-12 w-full justify-center">Cancel</SecondaryButton>
    </form>
  );
}
