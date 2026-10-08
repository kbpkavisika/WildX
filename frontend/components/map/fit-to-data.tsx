"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { MAP_FIT_PADDING_PX } from "@/lib/constants";
import type { LatLng } from "@/lib/patrols/types";

export function FitToData({ points }: { points: LatLng[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    map.fitBounds(points, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] });
    fitted.current = true;
  }, [map, points]);
  return null;
}
