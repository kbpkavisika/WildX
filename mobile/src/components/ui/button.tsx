import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { colors, ICON_STROKE, radii, sizes, space } from "@/lib/theme";
import { AppText } from "./text";

const QUIET_HIT_SLOP = (sizes.tap - sizes.quiet) / 2;
const ICON_HIT_SLOP = (sizes.tap - sizes.control) / 2;
const DISABLED_OPACITY = 0.6;

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  icon?: LucideIcon;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

function ButtonContent({ label, icon: Icon, color, variant }: { label: string; icon?: LucideIcon; color: string; variant: "label" | "fieldLabel" }) {
  return (
    <>
      {Icon && <Icon size={variant === "label" ? sizes.buttonIcon : sizes.smallIcon} color={color} strokeWidth={ICON_STROKE} />}
      <AppText variant={variant} color={color}>{label}</AppText>
    </>
  );
}

export function Button({ label, icon, disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.base, styles.primary, pressed && styles.primaryPressed, disabled && styles.disabled, style]}
      {...props}
    >
      <ButtonContent label={label} icon={icon} color={colors.onPrimary} variant="label" />
    </Pressable>
  );
}

export function SecondaryButton({ label, icon, disabled, textColor = colors.ink, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.base, styles.secondary, pressed && styles.secondaryPressed, disabled && styles.disabled, style]}
      {...props}
    >
      <ButtonContent label={label} icon={icon} color={textColor} variant="label" />
    </Pressable>
  );
}

export function QuietButton({ label, icon, disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={QUIET_HIT_SLOP}
      style={({ pressed }) => [styles.quiet, pressed && styles.secondaryPressed, disabled && styles.disabled, style]}
      {...props}
    >
      <ButtonContent label={label} icon={icon} color={colors.ink} variant="fieldLabel" />
    </Pressable>
  );
}

interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
  icon: LucideIcon;
  accessibilityLabel: string;
  size?: number;
}

export function IconButton({ icon: Icon, size = sizes.control, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={ICON_HIT_SLOP}
      style={({ pressed }) => [styles.icon, { width: size, height: size }, pressed && styles.secondaryPressed]}
      {...props}
    >
      <Icon size={sizes.buttonIcon} color={colors.ink} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.tap,
    borderRadius: radii.md,
    paddingHorizontal: space[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryHover },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space[4] },
  secondaryPressed: { backgroundColor: colors.surfaceMuted },
  quiet: {
    height: sizes.quiet,
    minWidth: sizes.quiet,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  icon: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: DISABLED_OPACITY },
});
