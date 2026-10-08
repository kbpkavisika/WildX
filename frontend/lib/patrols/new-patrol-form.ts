import { z } from "zod";
import type { AssignPatrolRequest } from "@/lib/api/patrols";
import { toIsoDate } from "@/lib/format";

export const newPatrolSchema = z.object({
  routeId: z.string().min(1, "Choose a route"),
  rangerId: z.string().min(1, "Choose a ranger"),
  scheduledDate: z.iso
    .date("Choose a date")
    .refine((value) => value >= toIsoDate(new Date()), "Date cannot be in the past"),
});

export type NewPatrolValues = z.infer<typeof newPatrolSchema>;

export function emptyNewPatrol(today: Date): NewPatrolValues {
  return { routeId: "", rangerId: "", scheduledDate: toIsoDate(today) };
}

export function toAssignRequest(values: NewPatrolValues): AssignPatrolRequest {
  return { routeId: Number(values.routeId), rangerId: Number(values.rangerId), scheduledDate: values.scheduledDate };
}
