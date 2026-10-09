import { MapPin } from "lucide-react-native";
import { ImageBackground, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { SIGN_IN_PHOTO_URL } from "@/lib/constants";
import { colors, fonts, ICON_STROKE, radii, sizes, space } from "@/lib/theme";

const PHOTO_HEIGHT = 220;
const TAGLINE_MAX_WIDTH = 340;
const CARD_PADDING = 12;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Screen>
        <View style={styles.card}>
          <ImageBackground
            source={{ uri: SIGN_IN_PHOTO_URL }}
            accessibilityLabel="Mother and calf elephant grazing in Udawalawe National Park"
            style={styles.photo}
            imageStyle={styles.photoImage}
            resizeMode="cover"
          >
            <AppText variant="pageTitle" style={styles.tagline}>Every herd, patrol and alert in one calm view.</AppText>
            <View style={styles.chip}>
              <MapPin size={sizes.smallIcon} color={colors.ink} strokeWidth={ICON_STROKE} />
              <AppText variant="caption" style={styles.chipText}>Udawalawe NP · 30,821 ha</AppText>
            </View>
          </ImageBackground>
          <View style={styles.form}>
            <SignInForm />
          </View>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, padding: CARD_PADDING, gap: CARD_PADDING },
  photo: {
    height: PHOTO_HEIGHT,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.secondarySoft,
    padding: space[7],
    justifyContent: "space-between",
  },
  photoImage: { borderRadius: radii.lg },
  tagline: { maxWidth: TAGLINE_MAX_WIDTH },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  chipText: { fontFamily: fonts.medium },
  form: { paddingHorizontal: space[3], paddingVertical: space[6] },
});
