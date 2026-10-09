import { z } from "zod";
import type { AlertRuleRequest, AlertRuleResponse } from "@/lib/api/alert-rules";
import { SEVERITIES } from "@/lib/enums";

const COOLDOWN_MIN = 0;
const ACK_SLA_MIN = 1;
const MINUTES_MAX = 1440;

function minutesBetween(min: number) {
  return z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= MINUTES_MAX, `Enter ${min} to ${MINUTES_MAX} minutes`);
}

export const ruleFormSchema = z.object({
  severity: z.enum(SEVERITIES),
  cooldownMin: minutesBetween(COOLDOWN_MIN),
  ackSlaMin: minutesBetween(ACK_SLA_MIN),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const EMPTY_RULE: RuleFormValues = { severity: SEVERITIES.MEDIUM, cooldownMin: "30", ackSlaMin: "15" };

export function toRuleValues(rule: AlertRuleResponse): RuleFormValues {
  return { severity: rule.severity, cooldownMin: String(rule.cooldownMin), ackSlaMin: String(rule.ackSlaMin) };
}

export function toRuleRequest(values: RuleFormValues): AlertRuleRequest {
  return { severity: values.severity, cooldownMin: Number(values.cooldownMin), ackSlaMin: Number(values.ackSlaMin) };
}
