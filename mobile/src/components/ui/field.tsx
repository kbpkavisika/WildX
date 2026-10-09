import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, radii, sizes, space, type } from "@/lib/theme";
import { AppText } from "./text";

const RING_WIDTH = 3;
const MULTILINE_HEIGHT = 96;

interface FieldProps {
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      {typeof label === "string" ? <AppText variant="fieldLabel" color={colors.inkBody}>{label}</AppText> : label}
      {children}
      {hint}
      {error && <AppText variant="caption" color={colors.negative}>{error}</AppText>}
    </View>
  );
}

export function FieldFrame({ invalid, focused, children }: { invalid: boolean; focused: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.ring, focused && !invalid && styles.ringFocused]}>
      <View style={[styles.frame, focused && styles.frameFocused, invalid && styles.frameInvalid]}>{children}</View>
    </View>
  );
}

interface TextFieldProps extends TextInputProps {
  invalid?: boolean;
}

export function TextField({ invalid = false, multiline, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <FieldFrame invalid={invalid} focused={focused}>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multiline, style]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  ring: { margin: -RING_WIDTH, borderWidth: RING_WIDTH, borderColor: "transparent", borderRadius: radii.field + RING_WIDTH },
  ringFocused: { borderColor: colors.secondarySoft },
  frame: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radii.field, backgroundColor: colors.surface },
  frameFocused: { borderColor: colors.primary },
  frameInvalid: { borderColor: colors.negative },
  input: { ...type.body, color: colors.ink, minHeight: sizes.tap, paddingHorizontal: space[3] },
  multiline: { minHeight: MULTILINE_HEIGHT, paddingVertical: 10 },
});
