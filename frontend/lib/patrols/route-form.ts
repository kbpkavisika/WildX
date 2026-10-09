import { z } from "zod";
import type { RouteRequest, RouteResponse } from "@/lib/api/patrols";
import { ROUTE_NAME_MAX } from "@/lib/constants";
import { parseLine, toLineGeojson } from "./geo";

const MIN_ROUTE_POINTS = 2;

export const routeFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(ROUTE_NAME_MAX, `Keep it under ${ROUTE_NAME_MAX} characters`),
  points: z.array(z.tuple([z.number(), z.number()])).min(MIN_ROUTE_POINTS, "Add at least 2 points"),
});

export type RouteFormValues = z.infer<typeof routeFormSchema>;

export const EMPTY_ROUTE: RouteFormValues = { name: "", points: [] };

export function toRouteValues(route: RouteResponse): RouteFormValues {
  return { name: route.name, points: parseLine(route.pathGeojson) ?? [] };
}

export function toRouteRequest(values: RouteFormValues): RouteRequest {
  return { name: values.name, pathGeojson: toLineGeojson(values.points) };
}
