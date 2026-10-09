import { z } from "zod";
import { SEVERITIES, ZONE_TYPES, type Severity, type ZoneType } from "@/lib/enums";
import { apiDelete, apiGet, apiPut } from "./client";

const alertRuleSchema = z.object({
  id: z.number(),
  parkId: z.number(),
  zoneType: z.enum(ZONE_TYPES),
  severity: z.enum(SEVERITIES),
  cooldownMin: z.number(),
  ackSlaMin: z.number(),
});

export type AlertRuleResponse = z.infer<typeof alertRuleSchema>;

export interface AlertRuleRequest {
  severity: Severity;
  cooldownMin: number;
  ackSlaMin: number;
}

export function fetchAlertRules(parkId: number): Promise<AlertRuleResponse[]> {
  return apiGet(`/parks/${parkId}/alert-rules`, z.array(alertRuleSchema));
}

export function saveAlertRule(parkId: number, zoneType: ZoneType, request: AlertRuleRequest): Promise<AlertRuleResponse> {
  return apiPut(`/parks/${parkId}/alert-rules/${zoneType}`, request, alertRuleSchema);
}

export function deleteAlertRule(parkId: number, zoneType: ZoneType): Promise<void> {
  return apiDelete(`/parks/${parkId}/alert-rules/${zoneType}`);
}
