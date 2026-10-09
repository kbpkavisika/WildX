"use client";

import { TileLayer } from "react-leaflet";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function BaseTiles() {
  return <TileLayer url={OSM_URL} attribution={OSM_ATTRIBUTION} />;
}
