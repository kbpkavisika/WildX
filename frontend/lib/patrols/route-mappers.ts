import type { RouteResponse } from "@/lib/api/patrols";
import { formatKm } from "@/lib/format";
import { parseLine, pathLengthM } from "./geo";
import type { RouteRow } from "./types";

export function toRouteRow(route: RouteResponse): RouteRow {
  const path = parseLine(route.pathGeojson) ?? [];
  return { id: route.id, name: route.name, length: formatKm(pathLengthM(path)), points: path.length };
}
