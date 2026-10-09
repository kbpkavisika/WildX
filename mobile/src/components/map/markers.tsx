import { Flag } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/ui/text";
import type { LatLng } from "@/lib/geo";
import { colors, fonts, radii } from "@/lib/theme";
import { toMapPoint } from "./base-map";

const CENTER = { x: 0.5, y: 0.5 };
const TEAM_HALO = 36;
const TEAM_DOT = 23;
const TEAM_BORDER = 3;
const TEAM_LABEL_SIZE = 11;
const INCIDENT_SIZE = 22;
const WAYPOINT_SIZE = 18;
const WAYPOINT_ICON = 10;
const WAYPOINT_STROKE = 2.4;
const HALO_ALPHA = "33";

export function TeamMarker({ position, number }: { position: LatLng; number: number }) {
  return (
    <Marker coordinate={toMapPoint(position)} anchor={CENTER} title="Your position" zIndex={1000}>
      <View style={styles.halo}>
        <View style={styles.team}>
          <AppText style={styles.teamLabel} color={colors.onPrimary}>{number}</AppText>
        </View>
      </View>
    </Marker>
  );
}

export function IncidentMarker({ position }: { position: LatLng }) {
  return (
    <Marker coordinate={toMapPoint(position)} anchor={CENTER} title="Incident location">
      <Svg width={INCIDENT_SIZE} height={INCIDENT_SIZE} viewBox="0 0 22 22">
        <Path d="M11 2L22 20H0Z" fill={colors.negative} />
        <Path d="M11 8v5M11 16v.5" stroke={colors.onPrimary} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    </Marker>
  );
}

export function WaypointMarker({ position, label }: { position: LatLng; label: string }) {
  return (
    <Marker coordinate={toMapPoint(position)} anchor={CENTER} title={label}>
      <View style={styles.waypoint}>
        <Flag size={WAYPOINT_ICON} color={colors.primary} strokeWidth={WAYPOINT_STROKE} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: TEAM_HALO,
    height: TEAM_HALO,
    borderRadius: radii.full,
    backgroundColor: `${colors.track1}${HALO_ALPHA}`,
    alignItems: "center",
    justifyContent: "center",
  },
  team: {
    width: TEAM_DOT,
    height: TEAM_DOT,
    borderRadius: radii.full,
    borderWidth: TEAM_BORDER,
    borderColor: colors.onPrimary,
    backgroundColor: colors.track1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLabel: { fontFamily: fonts.semibold, fontSize: TEAM_LABEL_SIZE, lineHeight: TEAM_LABEL_SIZE + 2 },
  waypoint: {
    width: WAYPOINT_SIZE,
    height: WAYPOINT_SIZE,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
