import { z } from "zod";

export type LatLng = [number, number];

export interface SectorShape {
  id: number;
  name: string;
  rings: LatLng[][];
}

const EARTH_RADIUS_M = 6_371_000;
const MIN_LINE_POINTS = 2;

const lineSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(MIN_LINE_POINTS),
});

const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
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

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseLine(text: string): LatLng[] | null {
  const line = lineSchema.safeParse(parseJson(text));
  return line.success ? line.data.coordinates.map(([lng, lat]): LatLng => [lat, lng]) : null;
}

export function toSectorShape(sector: { id: number; name: string; polygonGeojson: string }): SectorShape | null {
  const polygon = polygonSchema.safeParse(parseJson(sector.polygonGeojson));
  if (!polygon.success) return null;
  return {
    id: sector.id,
    name: sector.name,
    rings: polygon.data.coordinates.map((ring) => ring.map(([lng, lat]): LatLng => [lat, lng])),
  };
}
