import { ApiError, apiErrorMessage } from "@/lib/api/client";
import type { ZoneResponse } from "@/lib/api/zones";
import { counted } from "@/lib/devices/mappers";
import { ZONE_TYPE_LABELS } from "./labels";
import { parseBoundary } from "./zone-form";
import type { ZoneRow, ZonesView } from "./types";

const CONFLICT = 409;

function toZoneRow(zone: ZoneResponse): ZoneRow {
  const rings = parseBoundary(zone.polygonGeojson) ?? [];
  const corners = rings.length > 0 ? rings[0].length - 1 : 0;
  return {
    id: zone.id,
    name: zone.name,
    caption: `${ZONE_TYPE_LABELS[zone.type]} · ${counted(corners, "corner", "corners")}`,
    rings,
  };
}

export function toZonesView(zones: ZoneResponse[]): ZonesView {
  return { rows: zones.map(toZoneRow), zoneCount: zones.length };
}

export function zoneDeleteError(error: Error, name: string): string {
  return error instanceof ApiError && error.status === CONFLICT ? `${name} has alerts, so it cannot be deleted.` : apiErrorMessage(error);
}
