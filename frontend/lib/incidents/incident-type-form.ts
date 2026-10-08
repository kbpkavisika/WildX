import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import type { IncidentTypeRequest, IncidentTypeResponse } from "@/lib/api/incident-types";
import { SEVERITIES } from "@/lib/enums";

const NAME_MAX_LENGTH = 100;
const CONFLICT_STATUS = 409;
const NO_SEVERITY = "";

export const incidentTypeSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters`),
  defaultSeverity: z.union([z.enum(SEVERITIES), z.literal(NO_SEVERITY)]).transform((value, ctx) => {
    if (value !== NO_SEVERITY) return value;
    ctx.addIssue({ code: "custom", message: "Choose a severity" });
    return z.NEVER;
  }),
  active: z.boolean(),
});

export type IncidentTypeValues = z.input<typeof incidentTypeSchema>;
export type IncidentTypeRequestValues = z.output<typeof incidentTypeSchema>;

export const EMPTY_INCIDENT_TYPE: IncidentTypeValues = { name: "", defaultSeverity: NO_SEVERITY, active: true };

export function toIncidentTypeValues(type: IncidentTypeResponse): IncidentTypeValues {
  return { name: type.name, defaultSeverity: type.defaultSeverity, active: type.active };
}

export function toIncidentTypeRequest(values: IncidentTypeRequestValues): IncidentTypeRequest {
  return { name: values.name, defaultSeverity: values.defaultSeverity, active: values.active };
}

export function incidentTypeErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status === CONFLICT_STATUS) {
    return "This name is taken, or the type is used by incidents. Set it inactive instead.";
  }
  return error instanceof ApiError ? error.message : "Could not reach WildX. Try again.";
}
