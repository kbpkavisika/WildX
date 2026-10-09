import { Text, type TextProps } from "react-native";
import { colors, type, type TypeVariant } from "@/lib/theme";

interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
}

export function AppText({ variant = "body", color = colors.ink, style, ...props }: AppTextProps) {
  return <Text style={[type[variant], { color }, style]} {...props} />;
}
