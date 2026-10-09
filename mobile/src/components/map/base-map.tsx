import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Polygon, UrlTile, type LatLng as MapLatLng } from "react-native-maps";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_DELTA, MAP_FIT_PADDING_PX, MAP_MAX_ZOOM, OSM_TILE_URL } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/geo";
import { colors, radii } from "@/lib/theme";

const SECTOR_DASH = [6, 5];
const SECTOR_STROKE = 1.5;
const FIT_PADDING = { top: MAP_FIT_PADDING_PX, right: MAP_FIT_PADDING_PX, bottom: MAP_FIT_PADDING_PX, left: MAP_FIT_PADDING_PX };

export function toMapPoint([latitude, longitude]: LatLng): MapLatLng {
  return { latitude, longitude };
}

interface BaseMapProps {
  height: number;
  fitTo: LatLng[];
  sectors?: SectorShape[];
  focus?: LatLng | null;
  invalid?: boolean;
  accessibilityLabel: string;
  onPick?: (position: LatLng) => void;
  children?: React.ReactNode;
}

export function BaseMap({ height, fitTo, sectors = [], focus = null, invalid = false, accessibilityLabel, onPick, children }: BaseMapProps) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const fitCount = fitTo.length;

  const fit = useEffectEvent(() => {
    map.current?.fitToCoordinates(fitTo.map(toMapPoint), { edgePadding: FIT_PADDING, animated: false });
  });

  useEffect(() => {
    if (ready && fitCount > 0) fit();
  }, [ready, fitCount]);

  useEffect(() => {
    if (ready && focus) map.current?.animateCamera({ center: toMapPoint(focus) });
  }, [ready, focus]);

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.frame, { height }, invalid && styles.invalid]}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        mapType={Platform.OS === "android" ? "none" : "mutedStandard"}
        initialRegion={{
          latitude: MAP_DEFAULT_CENTER[0],
          longitude: MAP_DEFAULT_CENTER[1],
          latitudeDelta: MAP_DEFAULT_DELTA,
          longitudeDelta: MAP_DEFAULT_DELTA,
        }}
        maxZoomLevel={MAP_MAX_ZOOM}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        onMapReady={() => setReady(true)}
        onPress={(event) => onPick?.([event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude])}
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={MAP_MAX_ZOOM} shouldReplaceMapContent />
        {sectors.map((sector) => (
          <Polygon
            key={sector.id}
            coordinates={(sector.rings[0] ?? []).map(toMapPoint)}
            holes={sector.rings.slice(1).map((ring) => ring.map(toMapPoint))}
            fillColor={colors.mapLandFill}
            strokeColor={colors.primary}
            strokeWidth={SECTOR_STROKE}
            lineDashPattern={SECTOR_DASH}
          />
        ))}
        {children}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, overflow: "hidden", backgroundColor: colors.mapGround },
  invalid: { borderColor: colors.negative },
});
