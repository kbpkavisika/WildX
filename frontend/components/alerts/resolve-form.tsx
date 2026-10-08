"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { DISPOSITION_LABELS } from "@/lib/alerts/mappers";
import { resolveSchema, type ResolveValues } from "@/lib/alerts/resolve-form";
import type { Disposition } from "@/lib/enums";
import { cn } from "@/lib/utils";

const OUTCOME_ERROR_ID = "resolve-outcome-error";

interface ResolveFormProps {
  saving: boolean;
  onSubmit: (disposition: Disposition) => void;
  onCancel: () => void;
}

export function ResolveForm({ saving, onSubmit, onCancel }: ResolveFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ResolveValues>({ resolver: zodResolver(resolveSchema) });

  return (
    <form
      noValidate
      aria-label="Resolve alert"
      onSubmit={handleSubmit((values) => onSubmit(values.disposition))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
    >
      <span className="text-form-title">Resolve alert</span>
      <fieldset aria-describedby={errors.disposition ? OUTCOME_ERROR_ID : undefined} className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 p-0 text-field-label text-ink-body">Outcome</legend>
        <div className={cn("flex flex-col gap-2", errors.disposition && "rounded-md outline outline-negative")}>
          {Object.entries(DISPOSITION_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-line bg-card px-3 has-checked:border-primary has-checked:ring-3 has-checked:ring-lime-soft"
            >
              <input type="radio" value={value} className="m-0 size-4 accent-primary" {...register("disposition")} />
              <span className="text-body text-ink">{label}</span>
            </label>
          ))}
        </div>
        {errors.disposition && <span id={OUTCOME_ERROR_ID} className="text-caption text-negative">{errors.disposition.message}</span>}
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
          {saving ? "Resolving…" : "Resolve alert"}
        </Button>
      </div>
    </form>
  );
}
