import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, SecondaryButton } from "@/components/ui/button";
import { ChoiceRow } from "@/components/ui/choice-row";
import { FormPanel } from "@/components/ui/form-panel";
import { AppText } from "@/components/ui/text";
import { DISPOSITION_LABELS } from "@/lib/alerts/mappers";
import { resolveSchema, type ResolveValues } from "@/lib/alerts/resolve-form";
import type { Disposition } from "@/lib/enums";
import { colors, radii, space } from "@/lib/theme";

const DISPOSITION_OPTIONS = Object.entries(DISPOSITION_LABELS) as [Disposition, string][];

interface ResolveFormProps {
  onSubmit: (disposition: Disposition) => void;
  onCancel: () => void;
}

export function ResolveForm({ onSubmit, onCancel }: ResolveFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<ResolveValues>({ resolver: zodResolver(resolveSchema) });

  return (
    <FormPanel title="Resolve alert">
      <Controller
        control={control}
        name="disposition"
        render={({ field }) => (
          <View accessibilityRole="radiogroup" style={styles.group}>
            <AppText variant="fieldLabel" color={colors.inkBody}>Outcome</AppText>
            <View style={[styles.options, errors.disposition && styles.invalid]}>
              {DISPOSITION_OPTIONS.map(([value, label]) => (
                <ChoiceRow key={value} label={label} checked={field.value === value} onPress={() => field.onChange(value)} />
              ))}
            </View>
            {errors.disposition && <AppText variant="caption" color={colors.negative}>{errors.disposition.message}</AppText>}
          </View>
        )}
      />
      <Button label="Resolve alert" onPress={handleSubmit((values) => onSubmit(values.disposition))} />
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </FormPanel>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  options: { gap: space[2], borderWidth: 1, borderColor: "transparent", borderRadius: radii.field, padding: 3 },
  invalid: { borderColor: colors.negative },
});
