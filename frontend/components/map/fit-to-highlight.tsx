"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { MAP_FIT_PADDING_PX } from "@/lib/constants";
import type { LatLng } from "@/lib/patrols/types";

export function FitToHighlight({ rings }: { rings: LatLng[][] | null }) {
  const map = useMap();
  const key = rings ? JSON.stringify(rings.flat()) : null;
  useEffect(() => {
    if (key === null) return;
    const points: LatLng[] = JSON.parse(key);
    map.fitBounds(points, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] });
  }, [map, key]);
  return null;
}
