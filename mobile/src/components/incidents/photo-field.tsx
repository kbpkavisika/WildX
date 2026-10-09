import { launchCameraAsync, requestCameraPermissionsAsync } from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { QuietButton, SecondaryButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PHOTO_QUALITY } from "@/lib/constants";
import type { TakenPhoto } from "@/lib/incidents/report-form";
import { colors, radii, space } from "@/lib/theme";

const PHOTO_ASPECT = 4 / 3;
const PNG_EXTENSION = ".png";

interface PhotoFieldProps {
  value: TakenPhoto | null;
  error?: string;
  onChange: (photo: TakenPhoto | null) => void;
}

function mimeTypeOf(uri: string, mimeType: string | null | undefined): string {
  if (mimeType) return mimeType;
  return uri.toLowerCase().endsWith(PNG_EXTENSION) ? "image/png" : "image/jpeg";
}

export function PhotoField({ value, error, onChange }: PhotoFieldProps) {
  const [permissionError, setPermissionError] = useState<string | undefined>();

  const take = async () => {
    const permission = await requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionError("Allow camera access to take a photo.");
      return;
    }
    setPermissionError(undefined);
    const result = await launchCameraAsync({ mediaTypes: ["images"], quality: PHOTO_QUALITY });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    onChange({ uri: asset.uri, mimeType: mimeTypeOf(asset.uri, asset.mimeType), fileSize: asset.fileSize ?? 0 });
  };

  return (
    <Field label="Photo (optional)" error={error ?? permissionError}>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value.uri }} accessibilityLabel="Incident photo" style={styles.image} resizeMode="cover" />
          <View style={styles.actions}>
            <QuietButton label="Retake" onPress={() => void take()} />
            <QuietButton label="Remove" onPress={() => onChange(null)} />
          </View>
        </View>
      ) : (
        <SecondaryButton label="Take photo" icon={Camera} onPress={() => void take()} />
      )}
    </Field>
  );
}

const styles = StyleSheet.create({
  preview: { gap: space[3] },
  image: { width: "100%", aspectRatio: PHOTO_ASPECT, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceMuted },
  actions: { flexDirection: "row", gap: space[3] },
});
