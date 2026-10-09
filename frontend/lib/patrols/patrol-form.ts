import { z } from "zod";
import type { AssignPatrolRequest, PatrolResponse, UpdatePatrolRequest } from "@/lib/api/patrols";
import { toIsoDate } from "@/lib/format";

export const patrolFormSchema = z.object({
  routeId: z.string().min(1, "Choose a route"),
  rangerIds: z.array(z.string()).min(1, "Choose at least one ranger"),
  scheduledDate: z.iso
    .date("Choose a date")
    .refine((value) => value >= toIsoDate(new Date()), "Date cannot be in the past"),
});

export type PatrolFormValues = z.infer<typeof patrolFormSchema>;

export function emptyPatrol(today: Date): PatrolFormValues {
  return { routeId: "", rangerIds: [], scheduledDate: toIsoDate(today) };
}

export function toPatrolValues(patrol: PatrolResponse): PatrolFormValues {
  return { routeId: String(patrol.route.id), rangerIds: [String(patrol.rangerId)], scheduledDate: patrol.scheduledDate };
}

export function createPatrolLabel(rangerCount: number): string {
  return rangerCount > 1 ? `Create ${rangerCount} patrols` : "Create patrol";
}

export function toAssignRequest(values: PatrolFormValues): AssignPatrolRequest {
  return { routeId: Number(values.routeId), rangerIds: values.rangerIds.map(Number), scheduledDate: values.scheduledDate };
}

export function toUpdateRequest(values: PatrolFormValues): UpdatePatrolRequest {
  return { routeId: Number(values.routeId), rangerId: Number(values.rangerIds[0]), scheduledDate: values.scheduledDate };
}
