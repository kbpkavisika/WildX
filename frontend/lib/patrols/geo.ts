import { z } from "zod";
import type { LatLng } from "./types";

const EARTH_RADIUS_M = 6_371_000;
const MIN_LINE_POINTS = 2;
const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

const lineSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z
    .array(z.tuple([z.number().min(-LONGITUDE_LIMIT).max(LONGITUDE_LIMIT), z.number().min(-LATITUDE_LIMIT).max(LATITUDE_LIMIT)]))
    .min(MIN_LINE_POINTS),
});

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function pathLengthM(points: LatLng[]): number {
  return points.slice(1).reduce((total, point, index) => total + distanceM(points[index], point), 0);
}

export function parseLine(text: string): LatLng[] | null {
  let geojson: unknown;
  try {
    geojson = JSON.parse(text);
  } catch {
    return null;
  }
  const line = lineSchema.safeParse(geojson);
  return line.success ? line.data.coordinates.map(([lng, lat]): LatLng => [lat, lng]) : null;
}

export function toLineGeojson(points: LatLng[]): string {
  return JSON.stringify({ type: "LineString", coordinates: points.map(([lat, lng]) => [lng, lat]) });
}
