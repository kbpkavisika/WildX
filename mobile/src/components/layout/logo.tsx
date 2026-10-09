import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/ui/text";
import { colors, fonts } from "@/lib/theme";

const TILE_SIZE = 34;
const TILE_RADIUS = 10;
const LEAF_SIZE = 22;
const SECOND_LEAF_OPACITY = 0.6;

export function Logo() {
  return (
    <View style={styles.logo} accessibilityLabel="WildX">
      <View style={styles.tile}>
        <Svg width={LEAF_SIZE} height={LEAF_SIZE} viewBox="0 0 24 24">
          <Path d="M4 4C11 4.5 19 11 20 20C13 19.5 5 13 4 4Z" fill={colors.secondary} />
          <Path d="M20 4C19.5 11 13 19 4 20C4.5 13 11 5 20 4Z" fill={colors.secondary} fillOpacity={SECOND_LEAF_OPACITY} />
        </Svg>
      </View>
      <AppText variant="wordmark">
        Wild<AppText variant="wordmark" color={colors.primary} style={styles.x}>X</AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: "row", alignItems: "center", gap: 10, height: 36 },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: TILE_RADIUS,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  x: { fontFamily: fonts.bold },
});
