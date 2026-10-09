import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { z } from "zod";
import { MAP_PAGE_ORIGIN } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/geo";
import { colors, radii } from "@/lib/theme";
import { LEAFLET_PAGE } from "./leaflet-page";

const PAGE_SOURCE = { html: LEAFLET_PAGE, baseUrl: MAP_PAGE_ORIGIN };
const ORIGINS = ["*"];
const pickSchema = z.tuple([z.number(), z.number()]);

function run(view: WebView | null, call: string) {
  view?.injectJavaScript(`window.wildx && window.wildx.${call};true;`);
}

export interface MapLine {
  key: string;
  points: LatLng[];
  color: string;
  width: number;
  dashed?: boolean;
}

export interface MapMarker {
  key: string;
  kind: "team" | "incident" | "waypoint";
  position: LatLng;
  label: string;
  text?: string;
}

interface BaseMapProps {
  height: number;
  fitTo: LatLng[];
  sectors?: SectorShape[];
  lines?: MapLine[];
  markers?: MapMarker[];
  focus?: LatLng | null;
  invalid?: boolean;
  accessibilityLabel: string;
  onPick?: (position: LatLng) => void;
}

export function BaseMap({ height, fitTo, sectors = [], lines = [], markers = [], focus = null, invalid = false, accessibilityLabel, onPick }: BaseMapProps) {
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const fitCount = fitTo.length;
  const pickable = Boolean(onPick);
  const scene = useMemo(
    () => JSON.stringify({ sectors: sectors.map((sector) => sector.rings), lines, markers, pickable }),
    [sectors, lines, markers, pickable],
  );

  const fit = useEffectEvent(() => run(web.current, focus ? `focus(${JSON.stringify(focus)})` : `fit(${JSON.stringify(fitTo)})`));

  useEffect(() => {
    if (ready) run(web.current, `render(${scene})`);
  }, [ready, scene]);

  useEffect(() => {
    if (ready && fitCount > 0) fit();
  }, [ready, fitCount]);

  useEffect(() => {
    if (ready && focus) run(web.current, `focus(${JSON.stringify(focus)})`);
  }, [ready, focus]);

  const pick = (event: WebViewMessageEvent) => {
    const position = pickSchema.safeParse(JSON.parse(event.nativeEvent.data));
    if (position.success) onPick?.(position.data);
  };

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.frame, { height }, invalid && styles.invalid]}>
      <WebView
        ref={web}
        source={PAGE_SOURCE}
        originWhitelist={ORIGINS}
        onLoadEnd={() => setReady(true)}
        onMessage={pick}
        scrollEnabled={false}
        nestedScrollEnabled
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, overflow: "hidden", backgroundColor: colors.mapGround },
  invalid: { borderColor: colors.negative },
  map: { backgroundColor: colors.mapGround },
});
