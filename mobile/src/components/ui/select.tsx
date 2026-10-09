import { ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, floatingShadow, ICON_STROKE, radii, sizes, space, type } from "@/lib/theme";
import { IconButton } from "./button";
import { ChoiceRow } from "./choice-row";
import { FieldFrame } from "./field";
import { AppText } from "./text";

const SHEET_MAX_HEIGHT = "80%";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  title: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export function Select({ title, value, options, placeholder, invalid = false, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <FieldFrame invalid={invalid} focused={open}>
        <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => setOpen(true)} style={styles.trigger}>
          <AppText color={selected ? colors.ink : colors.inkMuted} style={styles.value} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </AppText>
          <ChevronDown size={sizes.buttonIcon} color={colors.inkMuted} strokeWidth={ICON_STROKE} />
        </Pressable>
      </FieldFrame>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={[styles.backdrop, { paddingBottom: space[4] + insets.bottom }]}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <AppText variant="formTitle" style={styles.title}>{title}</AppText>
              <IconButton icon={X} accessibilityLabel="Close" size={sizes.quiet} onPress={() => setOpen(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.options}>
              {options.map((option) => (
                <ChoiceRow key={option.value} label={option.label} checked={option.value === value} onPress={() => pick(option.value)} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minHeight: sizes.tap, flexDirection: "row", alignItems: "center", gap: space[2], paddingHorizontal: space[3] },
  value: { ...type.body, flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.backdrop, paddingHorizontal: space[4] },
  sheet: { maxHeight: SHEET_MAX_HEIGHT, backgroundColor: colors.surface, borderRadius: radii.lg, padding: space[4], gap: space[4], ...floatingShadow },
  header: { flexDirection: "row", alignItems: "center", gap: space[3] },
  title: { flex: 1 },
  options: { gap: space[2], padding: 3 },
});
