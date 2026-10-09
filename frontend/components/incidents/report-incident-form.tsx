"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useForm, useWatch } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useGpsFix, type GpsStatus } from "@/hooks/use-gps-fix";
import type { IncidentTypeResponse } from "@/lib/api/incident-types";
import { apiErrorMessage } from "@/lib/api/client";
import { COORDINATE_DECIMALS, INCIDENT_DESCRIPTION_MAX } from "@/lib/constants";
import { formatLatLng } from "@/lib/format";
import { LOCATION_SOURCES } from "@/lib/enums";
import {
  EMPTY_REPORT,
  PHOTO_TYPES,
  reportIncidentSchema,
  type PickedLocation,
  type ReportIncidentSubmit,
  type ReportIncidentValues,
} from "@/lib/incidents/report-form";
import type { LatLng, SectorShape } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const LocationPicker = dynamic(() => import("./location-picker"), { ssr: false });

const LARGE_FIELD = "h-12";

interface ReportIncidentFormProps {
  typeOptions: IncidentTypeResponse[];
  sectors: SectorShape[];
  saving: boolean;
  error: Error | null;
  onSubmit: (values: ReportIncidentSubmit) => void;
}

function locationHint(status: GpsStatus, location: PickedLocation | null): string {
  if (location?.source === LOCATION_SOURCES.MANUAL) return "Location set on the map · tap again to move it";
  if (location) return "Location from GPS · tap the map to change it";
  if (status === "failed") return "No GPS signal · tap the map to set the location";
  return "Finding your location…";
}

export function ReportIncidentForm({ typeOptions, sectors, saving, error, onSubmit }: ReportIncidentFormProps) {
  const { register, handleSubmit, setValue, getValues, control, formState: { errors, isSubmitted } } = useForm<
    ReportIncidentValues,
    unknown,
    ReportIncidentSubmit
  >({ resolver: zodResolver(reportIncidentSchema), defaultValues: EMPTY_REPORT });
  const location = useWatch({ control, name: "location" });
  const photo = useWatch({ control, name: "photo" });

  const setLocation = (position: LatLng, source: PickedLocation["source"]) =>
    setValue("location", { position, source }, { shouldValidate: isSubmitted });

  const gps = useGpsFix((position) => {
    if (getValues("location")?.source !== LOCATION_SOURCES.MANUAL) setLocation(position, LOCATION_SOURCES.GPS);
  });

  const setPhoto = (file: File | null) => setValue("photo", file, { shouldValidate: true });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Type" error={errors.typeId?.message}>
        <select {...register("typeId")} aria-invalid={!!errors.typeId} className={cn(fieldClass(!!errors.typeId), LARGE_FIELD)}>
          <option value="">Choose a type</option>
          {typeOptions.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-1.5 text-field-label text-ink-body">
        <span>Location</span>
        <LocationPicker
          value={location?.position ?? null}
          sectors={sectors}
          invalid={!!errors.location}
          onPick={(position) => setLocation(position, LOCATION_SOURCES.MANUAL)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-normal text-ink-muted">{locationHint(gps.status, location)}</span>
          {location && (
            <span className="text-caption font-normal text-ink-muted">{formatLatLng(location.position, COORDINATE_DECIMALS)}</span>
          )}
          {gps.status === "failed" && (
            <SecondaryButton onClick={gps.retry} className={LARGE_FIELD}>Try GPS again</SecondaryButton>
          )}
        </div>
        {errors.location && <span className="text-caption font-normal text-negative">{errors.location.message}</span>}
      </div>

      <Field label="Photo (optional)" error={errors.photo?.message}>
        <input
          type="file"
          accept={PHOTO_TYPES.join(",")}
          capture="environment"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          aria-invalid={!!errors.photo}
          className={cn(fieldClass(!!errors.photo), LARGE_FIELD, "py-3 file:mr-3 file:border-0 file:bg-transparent file:text-label file:text-primary")}
        />
        {photo && <span className="text-caption font-normal text-ink-muted">{photo.name}</span>}
      </Field>

      <Field label="Description (optional)" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          maxLength={INCIDENT_DESCRIPTION_MAX}
          placeholder="e.g. Wire snare near the water hole"
          aria-invalid={!!errors.description}
          className={cn(fieldClass(!!errors.description), "h-auto py-2.5")}
        />
      </Field>

      {error && <p role="alert" className="m-0 text-body text-negative">{apiErrorMessage(error)}</p>}
      <Button type="submit" disabled={saving} className="w-full justify-center disabled:opacity-60">
        {saving ? "Submitting…" : "Submit report"}
      </Button>
    </form>
  );
}
