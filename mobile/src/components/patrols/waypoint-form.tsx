import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Modal, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationPicker } from "@/components/incidents/location-picker";
import { Button, IconButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { AppText } from "@/components/ui/text";
import { WAYPOINT_NOTE_MAX } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/geo";
import { WAYPOINT_TYPE_LABELS } from "@/lib/patrols/mappers";
import { EMPTY_WAYPOINT, waypointFormSchema, type WaypointFormValues } from "@/lib/patrols/waypoint-form";
import { colors, sizes, space } from "@/lib/theme";

const NO_TYPE = "";
const TYPE_OPTIONS = [{ value: NO_TYPE, label: "No type" }, ...Object.entries(WAYPOINT_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

interface WaypointFormProps {
  gpsPosition: LatLng | null;
  near: LatLng | null;
  sectors: SectorShape[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: WaypointFormValues) => void;
  onClose: () => void;
}

interface WaypointSheetProps extends WaypointFormProps {
  visible: boolean;
}

export function WaypointSheet({ visible, ...form }: WaypointSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={form.onClose}
    >
      <WaypointForm {...form} />
    </Modal>
  );
}

function WaypointForm({ gpsPosition, near, sectors, saving, error, onSubmit, onClose }: WaypointFormProps) {
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState: { errors } } = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointFormSchema),
    defaultValues: EMPTY_WAYPOINT,
  });
  const picked = useWatch({ control, name: "position" });
  const position = picked ?? gpsPosition;

  return (
    <ScrollView
      style={styles.sheet}
      contentContainerStyle={[styles.content, { paddingTop: space[4] + (Platform.OS === "android" ? insets.top : 0), paddingBottom: space[4] + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.header}>
        <View style={styles.heading}>
          <AppText variant="formTitle" accessibilityRole="header">Add waypoint</AppText>
          <AppText variant="caption" color={position ? colors.inkMuted : colors.negative}>
            {position ? "Tap the map to choose the location." : "Waiting for GPS. Tap the map to choose the location."}
          </AppText>
        </View>
        <IconButton icon={X} accessibilityLabel="Close" size={sizes.quiet} onPress={onClose} />
      </View>
      <Controller
        control={control}
        name="position"
        render={({ field }) => <LocationPicker value={position} sectors={sectors} marker="waypoint" near={near} onPick={field.onChange} />}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: space[4], gap: space[4] },
  header: { flexDirection: "row", alignItems: "flex-start", gap: space[3] },
  heading: { flex: 1, gap: space[1] },
});
