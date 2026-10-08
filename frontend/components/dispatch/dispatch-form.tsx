"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { StatusDot } from "@/components/ui/status-dot";
import { useDispatch } from "@/hooks/use-dispatch";
import type { DispatchResponse } from "@/lib/api/dispatches";
import { apiErrorMessage } from "@/lib/api/client";
import { dispatchFormSchema, EMPTY_DISPATCH, type DispatchFormValues, type DispatchSource } from "@/lib/dispatch/dispatch-form";
import type { ResponderOption } from "@/lib/dispatch/types";
import type { LatLng } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

interface DispatchFormProps {
  source: DispatchSource;
  position: LatLng | null;
  onDispatched: (dispatch: DispatchResponse) => void;
  onCancel: () => void;
}

function ResponderChoice({ option, ...input }: { option: ResponderOption } & React.ComponentProps<"input">) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-line bg-card px-3 py-2 has-checked:border-primary has-checked:ring-3 has-checked:ring-lime-soft">
      <input type="radio" value={option.id} className="m-0 size-4 accent-primary" {...input} />
      <InitialsAvatar initials={option.initials} />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="truncate text-body font-medium text-ink">{option.name}</span>
        <StatusDot tone={option.presence.tone}>{option.presence.label}</StatusDot>
      </span>
      <span className="shrink-0 text-caption text-ink-muted">{option.distance}</span>
    </label>
  );
}

export function DispatchForm({ source, position, onDispatched, onCancel }: DispatchFormProps) {
  const { isPending, isError, options, dispatch } = useDispatch(source, position, onDispatched);
  const { register, handleSubmit, formState: { errors } } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchFormSchema),
    defaultValues: EMPTY_DISPATCH,
  });

  return (
    <form
      noValidate
      aria-label="Dispatch responder"
      onSubmit={handleSubmit((values) => dispatch.mutate(values))}
      className="flex flex-col gap-4 rounded-[14px] bg-surface-form p-5"
    >
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 p-0 text-field-label text-ink-body">Ranger · nearest first</legend>
        {isPending && <p className="m-0 text-body text-ink-muted">Finding rangers…</p>}
        {isError && <p className="m-0 text-body text-negative">Could not load rangers.</p>}
        {!isPending && !isError && options.length === 0 && (
          <p className="m-0 text-body text-ink-muted">No active rangers in this park.</p>
        )}
        <div className={cn("flex max-h-[320px] flex-col gap-2 overflow-y-auto", errors.responderId && "rounded-md outline outline-negative")}>
          {options.map((option) => (
            <ResponderChoice key={option.id} option={option} aria-invalid={!!errors.responderId} {...register("responderId")} />
          ))}
        </div>
        {errors.responderId && <span className="text-caption text-negative">{errors.responderId.message}</span>}
      </fieldset>
      <Field label="Note for the ranger (optional)" error={errors.note?.message}>
        <textarea
          {...register("note")}
          rows={2}
          placeholder="e.g. Bring wire cutters"
          aria-invalid={!!errors.note}
          className={cn(fieldClass(!!errors.note), "h-auto py-2.5")}
        />
      </Field>
      {dispatch.isError && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(dispatch.error)}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <Button type="submit" disabled={dispatch.isPending} className="h-10 px-[18px] disabled:opacity-60">
          {dispatch.isPending ? "Dispatching…" : "Dispatch"}
        </Button>
      </div>
    </form>
  );
}
