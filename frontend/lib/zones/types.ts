import type { LatLng } from "@/lib/patrols/types";

export interface ZoneRow {
  id: number;
  name: string;
  caption: string;
  rings: LatLng[][];
}

export interface ZonesView {
  rows: ZoneRow[];
  zoneCount: number;
}
