"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/client";
import { WAYPOINT_TYPE_LABELS } from "@/lib/patrols/mappers";
import { EMPTY_WAYPOINT, waypointFormSchema, type WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { cn } from "@/lib/utils";

const LARGE = "h-12";

interface WaypointFormProps {
  hasFix: boolean;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: WaypointFormValues) => void;
  onCancel: () => void;
}

export function WaypointForm({ hasFix, saving, error, onSubmit, onCancel }: WaypointFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointFormSchema),
    defaultValues: EMPTY_WAYPOINT,
  });

  return (
    <form noValidate aria-label="Add waypoint" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-form-title">Add waypoint</h2>
        <p className={cn("m-0 text-caption", hasFix ? "text-ink-muted" : "text-negative")}>
          {hasFix ? "Uses your current position." : "Waiting for GPS. Save is ready once your position is found."}
        </p>
      </div>
      <Field label="Type (optional)">
        <select {...register("waypointType")} className={cn(fieldClass(false), LARGE)}>
          <option value="">No type</option>
          {Object.entries(WAYPOINT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)" error={errors.note?.message}>
        <textarea
          {...register("note")}
          rows={3}
          placeholder="e.g. Waterhole clear"
          aria-invalid={!!errors.note}
          className={cn(fieldClass(!!errors.note), "h-auto py-2.5")}
        />
      </Field>
      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <Button type="submit" disabled={!hasFix || saving} className="w-full justify-center disabled:opacity-60">
        {saving ? "Saving…" : "Save waypoint"}
      </Button>
      <SecondaryButton onClick={onCancel} className={cn(LARGE, "w-full justify-center")}>Cancel</SecondaryButton>
    </form>
  );
}
