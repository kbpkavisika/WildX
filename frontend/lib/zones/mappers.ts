import type { AlertRuleResponse } from "@/lib/api/alert-rules";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import type { ZoneResponse } from "@/lib/api/zones";
import { counted } from "@/lib/devices/mappers";
import type { ZoneType } from "@/lib/enums";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";
import { ZONE_TYPE_LABELS } from "./labels";
import { parseBoundary } from "./zone-form";
import type { RuleRow, RuleSummary, ZoneRow, ZonesView } from "./types";

const CONFLICT = 409;

function toRuleSummary(rule: AlertRuleResponse | undefined): RuleSummary | null {
  if (!rule) return null;
  return { severity: SEVERITY_DISPLAY[rule.severity], caption: `Acknowledge within ${rule.ackSlaMin} min` };
}

function toZoneRow(zone: ZoneResponse, rule: AlertRuleResponse | undefined): ZoneRow {
  const rings = parseBoundary(zone.polygonGeojson) ?? [];
  const corners = rings.length > 0 ? rings[0].length - 1 : 0;
  return {
    id: zone.id,
    name: zone.name,
    caption: `${ZONE_TYPE_LABELS[zone.type]} · ${counted(corners, "corner", "corners")}`,
    rule: toRuleSummary(rule),
    rings,
  };
}

function toRuleRow(zoneType: ZoneType, rule: AlertRuleResponse | undefined): RuleRow {
  return {
    zoneType,
    label: ZONE_TYPE_LABELS[zoneType],
    severity: rule ? SEVERITY_DISPLAY[rule.severity] : null,
    caption: rule ? `Cool-down ${rule.cooldownMin} min · acknowledge within ${rule.ackSlaMin} min` : "No rule, so these zones raise no alerts.",
  };
}

export function toZonesView(zones: ZoneResponse[], rules: AlertRuleResponse[]): ZonesView {
  const ruleFor = (zoneType: ZoneType) => rules.find((rule) => rule.zoneType === zoneType);
  const zoneTypes = Object.keys(ZONE_TYPE_LABELS) as ZoneType[];
  return {
    rows: zones.map((zone) => toZoneRow(zone, ruleFor(zone.type))),
    rules: zoneTypes.map((zoneType) => toRuleRow(zoneType, ruleFor(zoneType))),
    zoneCount: zones.length,
    ruleCount: rules.length,
    typeCount: zoneTypes.length,
  };
}

export function zoneDeleteError(error: Error, name: string): string {
  return error instanceof ApiError && error.status === CONFLICT ? `${name} has alerts, so it cannot be deleted.` : apiErrorMessage(error);
}
