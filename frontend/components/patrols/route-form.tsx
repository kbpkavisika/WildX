"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button, QuietButton, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useParkSectors } from "@/hooks/use-park-sectors";
import { apiErrorMessage } from "@/lib/api/client";
import { counted } from "@/lib/devices/mappers";
import { formatKm } from "@/lib/format";
import { parseLine, pathLengthM, toLineGeojson } from "@/lib/patrols/geo";
import { routeFormSchema, type RouteFormValues } from "@/lib/patrols/route-form";
import type { LatLng } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const RouteDrawMap = dynamic(() => import("./route-draw-map"), { ssr: false });

const PATH_PLACEHOLDER = '{"type":"LineString","coordinates":[[81.40,6.31],[81.43,6.34]]}';

interface RouteFormProps {
  title: string;
  submitLabel: string;
  defaultValues: RouteFormValues;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: RouteFormValues) => void;
  onClose: () => void;
}

export function RouteForm({ title, submitLabel, defaultValues, saving, error, onSubmit, onClose }: RouteFormProps) {
  const sectors = useParkSectors();
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitted } } = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues,
  });
  const points = useWatch({ control, name: "points" });
  const pointsError = errors.points?.message ?? errors.points?.root?.message;
  const pastedInvalid = pasted.trim() !== "" && parseLine(pasted) === null;

  const setPoints = (next: LatLng[]) => setValue("points", next, { shouldValidate: isSubmitted });

  const onPaste = (text: string) => {
    setPasted(text);
    setPoints(parseLine(text) ?? []);
  };

  const togglePaste = () => {
    if (!pasting) setPasted(points.length > 0 ? toLineGeojson(points) : "");
    setPasting(!pasting);
  };

  return (
    <Modal title={title} wide onClose={onClose}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Kumbukgaha river trail" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
        </Field>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-caption text-ink-muted">
              {counted(points.length, "point", "points")} · {formatKm(pathLengthM(points))}
            </span>
            {!pasting && (
              <>
                <QuietButton onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="disabled:opacity-50">
                  Undo
                </QuietButton>
                <QuietButton onClick={() => setPoints([])} disabled={points.length === 0} className="disabled:opacity-50">
                  Clear
                </QuietButton>
              </>
            )}
            <QuietButton onClick={togglePaste} aria-pressed={pasting}>
              {pasting ? "Draw on map" : "Paste GeoJSON"}
            </QuietButton>
          </div>
          {pasting ? (
            <Field label="Path (GeoJSON LineString)" error={pastedInvalid ? "Paste a GeoJSON LineString with at least 2 points" : undefined}>
              <textarea
                value={pasted}
                onChange={(event) => onPaste(event.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={PATH_PLACEHOLDER}
                aria-invalid={pastedInvalid || !!pointsError}
                className={cn(fieldClass(pastedInvalid || !!pointsError), "h-auto min-h-[132px] resize-y py-2.5 font-mono text-[13px] leading-5")}
              />
            </Field>
          ) : (
            <RouteDrawMap points={points} sectors={sectors} invalid={!!pointsError} onAdd={(point) => setPoints([...points, point])} />
          )}
          {pointsError && <span className="text-caption text-negative">{pointsError}</span>}
          {!pasting && !pointsError && <span className="text-caption text-ink-muted">Click the map to add each point of the path in order.</span>}
        </div>
        {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
