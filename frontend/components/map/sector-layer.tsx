"use client";

import { Polygon } from "react-leaflet";
import { MAP_AREA_FILL_OPACITY } from "@/lib/constants";
import type { SectorShape } from "@/lib/patrols/types";

const SECTOR_STYLE = { className: "fill-map-land stroke-primary", weight: 1.5, dashArray: "6 5", fillOpacity: MAP_AREA_FILL_OPACITY };

export function SectorLayer({ sectors }: { sectors: SectorShape[] }) {
  return sectors.map((sector) => <Polygon key={sector.id} positions={sector.rings} pathOptions={SECTOR_STYLE} />);
}
