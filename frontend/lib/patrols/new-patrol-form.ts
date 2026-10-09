import { z } from "zod";
import type { AssignPatrolRequest } from "@/lib/api/patrols";
import { toIsoDate } from "@/lib/format";

export const newPatrolSchema = z.object({
  routeId: z.string().min(1, "Choose a route"),
  rangerIds: z.array(z.string()).min(1, "Choose at least one ranger"),
  scheduledDate: z.iso
    .date("Choose a date")
    .refine((value) => value >= toIsoDate(new Date()), "Date cannot be in the past"),
});

export type NewPatrolValues = z.infer<typeof newPatrolSchema>;

export function emptyNewPatrol(today: Date): NewPatrolValues {
  return { routeId: "", rangerIds: [], scheduledDate: toIsoDate(today) };
}

export function createPatrolLabel(rangerCount: number): string {
  return rangerCount > 1 ? `Create ${rangerCount} patrols` : "Create patrol";
}

export function toAssignRequest(values: NewPatrolValues): AssignPatrolRequest {
  return { routeId: Number(values.routeId), rangerIds: values.rangerIds.map(Number), scheduledDate: values.scheduledDate };
}
