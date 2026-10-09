"use client";

import { AttributionControl, TileLayer } from "react-leaflet";
import { MAP_MAX_ZOOM, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/constants";

export function BaseTiles() {
  return (
    <>
      <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} maxZoom={MAP_MAX_ZOOM} />
      <AttributionControl position="bottomright" prefix={false} />
    </>
  );
}
