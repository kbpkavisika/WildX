import { z } from "zod";
import type { ZoneRequest, ZoneResponse } from "@/lib/api/zones";
import { ZONE_TYPES } from "@/lib/enums";
import type { LatLng } from "@/lib/patrols/types";

const NAME_MAX_LENGTH = 255;
const BOUNDARY_MAX_LENGTH = 100_000;
const MIN_RING_POINTS = 4;
const MIN_CORNERS = 3;
const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;
export const BOUNDARY_ERROR = "Paste a closed GeoJSON polygon";

const positionSchema = z.tuple([
  z.number().min(-LONGITUDE_LIMIT).max(LONGITUDE_LIMIT),
  z.number().min(-LATITUDE_LIMIT).max(LATITUDE_LIMIT),
]);

const ringSchema = z
  .array(positionSchema)
  .min(MIN_RING_POINTS)
  .refine((ring) => {
    const [first, last] = [ring[0], ring[ring.length - 1]];
    return first[0] === last[0] && first[1] === last[1];
  })
  .refine((ring) => new Set(ring.map((point) => point.join())).size >= MIN_CORNERS);

const polygonSchema = z.object({ type: z.literal("Polygon"), coordinates: z.array(ringSchema).min(1) });

export function parseBoundary(text: string): LatLng[][] | null {
  let geojson: unknown;
  try {
    geojson = JSON.parse(text);
  } catch {
    return null;
  }
  const polygon = polygonSchema.safeParse(geojson);
  if (!polygon.success) return null;
  return polygon.data.coordinates.map((ring) => ring.map(([lng, lat]): LatLng => [lat, lng]));
}

export const zoneFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters`),
  type: z.enum(ZONE_TYPES),
  boundary: z
    .string()
    .trim()
    .max(BOUNDARY_MAX_LENGTH, "This boundary is too long")
    .refine((value) => parseBoundary(value) !== null, BOUNDARY_ERROR),
});

export type ZoneFormValues = z.infer<typeof zoneFormSchema>;

export const EMPTY_ZONE: ZoneFormValues = { name: "", type: ZONE_TYPES.FARMLAND, boundary: "" };

export function toZoneValues(zone: ZoneResponse): ZoneFormValues {
  return { name: zone.name, type: zone.type, boundary: zone.polygonGeojson };
}

export function toZoneRequest(values: ZoneFormValues): ZoneRequest {
  return { name: values.name, type: values.type, polygonGeojson: values.boundary };
}
