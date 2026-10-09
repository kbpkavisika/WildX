"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChoiceRow } from "@/components/forms/choice-row";
import { Button, SecondaryButton } from "@/components/ui/button";
import { DISPOSITION_LABELS } from "@/lib/alerts/mappers";
import { resolveSchema, type ResolveValues } from "@/lib/alerts/resolve-form";
import type { Disposition } from "@/lib/enums";
import { cn } from "@/lib/utils";

const OUTCOME_ERROR_ID = "resolve-outcome-error";
const FULL_WIDTH = "h-12 w-full justify-center";

interface ResolveFormProps {
  saving: boolean;
  stacked?: boolean;
  onSubmit: (disposition: Disposition) => void;
  onCancel: () => void;
}

export function ResolveForm({ saving, stacked = false, onSubmit, onCancel }: ResolveFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ResolveValues>({ resolver: zodResolver(resolveSchema) });
  const submit = (
    <Button type="submit" disabled={saving} className={cn("h-10 px-[18px] disabled:opacity-60", stacked && FULL_WIDTH)}>
      {saving ? "Resolving…" : "Resolve alert"}
    </Button>
  );

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
            <ChoiceRow key={value} label={label} value={value} {...register("disposition")} />
          ))}
        </div>
        {errors.disposition && <span id={OUTCOME_ERROR_ID} className="text-caption text-negative">{errors.disposition.message}</span>}
      </fieldset>
      {stacked ? (
        <div className="flex flex-col gap-3">
          {submit}
          <SecondaryButton onClick={onCancel} className={FULL_WIDTH}>Cancel</SecondaryButton>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          {submit}
        </div>
      )}
    </form>
  );
}
