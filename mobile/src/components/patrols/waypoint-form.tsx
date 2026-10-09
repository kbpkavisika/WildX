import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LocationPicker } from "@/components/incidents/location-picker";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { FormPanel } from "@/components/ui/form-panel";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { AppText } from "@/components/ui/text";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/geo";
import { WAYPOINT_TYPE_LABELS } from "@/lib/patrols/mappers";
import { EMPTY_WAYPOINT, waypointFormSchema, type WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { colors } from "@/lib/theme";

const NO_TYPE = "";
const TYPE_OPTIONS = [{ value: NO_TYPE, label: "No type" }, ...Object.entries(WAYPOINT_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

interface WaypointFormProps {
  gpsPosition: LatLng | null;
  sectors: SectorShape[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: WaypointFormValues) => void;
  onCancel: () => void;
}

export function WaypointForm({ gpsPosition, sectors, saving, error, onSubmit, onCancel }: WaypointFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointFormSchema),
    defaultValues: EMPTY_WAYPOINT,
  });
  const picked = useWatch({ control, name: "position" });
  const position = picked ?? gpsPosition;

  return (
    <FormPanel
      title="Add waypoint"
      caption={
        <AppText variant="caption" color={position ? colors.inkMuted : colors.negative}>
          {position ? "Tap the map to choose the location." : "Waiting for GPS. Tap the map to choose the location."}
        </AppText>
      }
    >
      <Controller
        control={control}
        name="position"
        render={({ field }) => <LocationPicker value={position} sectors={sectors} marker="waypoint" onPick={field.onChange} />}
      />
      <Controller
        control={control}
        name="waypointType"
        render={({ field }) => (
          <Field label="Type (optional)">
            <Select title="Waypoint type" value={field.value} options={TYPE_OPTIONS} placeholder="No type" onChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <Field label="Note (optional)" error={errors.note?.message}>
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.note}
              multiline
              maxLength={WAYPOINT_NOTE_MAX}
              placeholder="e.g. Waterhole clear"
            />
          </Field>
        )}
      />
      {error && <Notice tone="negative">{error}</Notice>}
      <Button label={saving ? "Saving…" : "Save waypoint"} disabled={!position || saving} onPress={handleSubmit(onSubmit)} />
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </FormPanel>
  );
}
