import { StyleSheet, View } from "react-native";
import { colors, radii, space } from "@/lib/theme";
import { AppText } from "./text";

interface FormPanelProps {
  title?: string;
  caption?: React.ReactNode;
  children: React.ReactNode;
}

export function FormPanel({ title, caption, children }: FormPanelProps) {
  return (
    <View style={styles.panel}>
      {(title || caption) && (
        <View style={styles.heading}>
          {title && <AppText variant="formTitle" accessibilityRole="header">{title}</AppText>}
          {caption}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space[4], borderRadius: radii.lg, backgroundColor: colors.surfaceForm, padding: space[4] },
  heading: { gap: space[1] },
});
