import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { FormPanel } from "@/components/ui/form-panel";
import { Select } from "@/components/ui/select";
import { AppText } from "@/components/ui/text";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import { WAYPOINT_TYPE_LABELS } from "@/lib/patrols/mappers";
import { EMPTY_WAYPOINT, waypointFormSchema, type WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { colors } from "@/lib/theme";

const NO_TYPE = "";
const TYPE_OPTIONS = [{ value: NO_TYPE, label: "No type" }, ...Object.entries(WAYPOINT_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

interface WaypointFormProps {
  hasFix: boolean;
  onSubmit: (values: WaypointFormValues) => void;
  onCancel: () => void;
}

export function WaypointForm({ hasFix, onSubmit, onCancel }: WaypointFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointFormSchema),
    defaultValues: EMPTY_WAYPOINT,
  });

  return (
    <FormPanel
      title="Add waypoint"
      caption={
        <AppText variant="caption" color={hasFix ? colors.inkMuted : colors.negative}>
          {hasFix ? "Uses your current position." : "Waiting for GPS. Save is ready once your position is found."}
        </AppText>
      }
    >
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
      <Button label="Save waypoint" disabled={!hasFix} onPress={handleSubmit(onSubmit)} />
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </FormPanel>
  );
}
