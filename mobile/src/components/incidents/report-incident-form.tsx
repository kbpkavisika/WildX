import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { AppText } from "@/components/ui/text";
import { useGpsFix, type GpsStatus } from "@/hooks/use-gps-fix";
import type { IncidentTypeResponse } from "@/lib/api/incidents";
import { COORDINATE_DECIMALS, INCIDENT_DESCRIPTION_MAX } from "@/lib/constants";
import { LOCATION_SOURCES } from "@/lib/enums";
import { formatLatLng } from "@/lib/format";
import type { LatLng, SectorShape } from "@/lib/geo";
import {
  EMPTY_REPORT,
  reportIncidentSchema,
  type PickedLocation,
  type ReportIncidentSubmit,
  type ReportIncidentValues,
} from "@/lib/incidents/report-form";
import { colors, space } from "@/lib/theme";
import { LocationPicker } from "./location-picker";
import { PhotoField } from "./photo-field";

interface ReportIncidentFormProps {
  typeOptions: IncidentTypeResponse[];
  sectors: SectorShape[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: ReportIncidentSubmit) => void;
}

function locationHint(status: GpsStatus, location: PickedLocation | null): string {
  if (location?.source === LOCATION_SOURCES.MANUAL) return "Location set on the map · tap again to move it";
  if (location) return "Location from GPS · tap the map to change it";
  if (status === "failed") return "No GPS signal · tap the map to set the location";
  return "Finding your location…";
}

export function ReportIncidentForm({ typeOptions, sectors, saving, error, onSubmit }: ReportIncidentFormProps) {
  const { control, handleSubmit, setValue, getValues, formState: { errors, isSubmitted } } = useForm<
    ReportIncidentValues,
    unknown,
    ReportIncidentSubmit
  >({ resolver: zodResolver(reportIncidentSchema), defaultValues: EMPTY_REPORT });
  const location = useWatch({ control, name: "location" });

  const setLocation = (position: LatLng, source: PickedLocation["source"]) =>
    setValue("location", { position, source }, { shouldValidate: isSubmitted });

  const gps = useGpsFix((position) => {
    if (getValues("location")?.source !== LOCATION_SOURCES.MANUAL) setLocation(position, LOCATION_SOURCES.GPS);
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="typeId"
        render={({ field }) => (
          <Field label="Type" error={errors.typeId?.message}>
            <Select
              title="Incident type"
              value={field.value}
              options={typeOptions.map((type) => ({ value: String(type.id), label: type.name }))}
              placeholder="Choose a type"
              invalid={!!errors.typeId}
              onChange={field.onChange}
            />
          </Field>
        )}
      />

      <Field
        label="Location"
        error={errors.location?.message}
        hint={
          <View style={styles.hint}>
            <AppText variant="caption" color={colors.inkMuted}>{locationHint(gps.status, location ?? null)}</AppText>
            {location && <AppText variant="caption" color={colors.inkMuted}>{formatLatLng(location.position, COORDINATE_DECIMALS)}</AppText>}
            {gps.status === "failed" && <SecondaryButton label="Try GPS again" onPress={gps.retry} />}
          </View>
        }
      >
        <LocationPicker
          value={location?.position ?? null}
          sectors={sectors}
          invalid={!!errors.location}
          onPick={(position) => setLocation(position, LOCATION_SOURCES.MANUAL)}
        />
      </Field>

      <Controller
        control={control}
        name="photo"
        render={({ field }) => (
          <PhotoField value={field.value} error={errors.photo?.message} onChange={(photo) => setValue("photo", photo, { shouldValidate: true })} />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Field label="Description (optional)" error={errors.description?.message}>
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.description}
              multiline
              maxLength={INCIDENT_DESCRIPTION_MAX}
              placeholder="e.g. Wire snare near the water hole"
            />
          </Field>
        )}
      />

      {error && <Notice tone="negative">{error}</Notice>}
      <Button label={saving ? "Submitting…" : "Submit report"} disabled={saving} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space[5] },
  hint: { gap: space[2] },
});
