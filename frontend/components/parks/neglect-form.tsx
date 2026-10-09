"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { neglectFormSchema, type NeglectFormValues } from "@/lib/parks/forms";

interface NeglectFormProps {
  neglectDays: number;
  saving: boolean;
  saved: boolean;
  error: Error | null;
  onSubmit: (neglectDays: number) => void;
}

export function NeglectForm({ neglectDays, saving, saved, error, onSubmit }: NeglectFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<NeglectFormValues>({
    resolver: zodResolver(neglectFormSchema),
    defaultValues: { neglectDays: String(neglectDays) },
  });

  return (
    <Card label="Coverage">
      <CardTitle>Coverage</CardTitle>
      <p className="m-0 text-caption text-ink-muted">A sector not patrolled for longer than this is highlighted as neglected.</p>
      <form noValidate onSubmit={handleSubmit((values) => onSubmit(Number(values.neglectDays)))} className="flex flex-wrap items-start gap-3">
        <div className="w-full max-w-[220px]">
          <Field label="Neglected after (days)" error={errors.neglectDays?.message}>
            <input {...register("neglectDays")} inputMode="numeric" aria-invalid={!!errors.neglectDays} className={fieldClass(!!errors.neglectDays)} />
          </Field>
        </div>
        <Button type="submit" disabled={saving} className="mt-[26px] h-10 px-[18px] disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
      {saved && <p role="status" className="m-0 text-body text-positive">Saved.</p>}
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
    </Card>
  );
}
