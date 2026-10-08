import type { IncidentTypeResponse } from "@/lib/api/incident-types";
import { SEVERITIES, type Severity } from "@/lib/enums";
import type { ChipView, IncidentTypeRow, IncidentTypesView } from "./types";

export const SEVERITY_DISPLAY: Record<Severity, ChipView> = {
  [SEVERITIES.LOW]: { tone: "neutral", label: "Low" },
  [SEVERITIES.MEDIUM]: { tone: "neutral", label: "Medium" },
  [SEVERITIES.HIGH]: { tone: "negative", label: "High" },
  [SEVERITIES.CRITICAL]: { tone: "negative", label: "Critical" },
};

const ACTIVE_DISPLAY: ChipView = { tone: "positive", label: "Active" };
const INACTIVE_DISPLAY: ChipView = { tone: "neutral", label: "Inactive" };

function toIncidentTypeRow(type: IncidentTypeResponse): IncidentTypeRow {
  return {
    id: type.id,
    name: type.name,
    severity: SEVERITY_DISPLAY[type.defaultSeverity],
    status: type.active ? ACTIVE_DISPLAY : INACTIVE_DISPLAY,
  };
}

export function toActiveTypeOptions(types: IncidentTypeResponse[]): IncidentTypeResponse[] {
  return types.filter((type) => type.active).sort((a, b) => a.name.localeCompare(b.name));
}

export function toIncidentTypesView(types: IncidentTypeResponse[]): IncidentTypesView {
  const sorted = [...types].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  const activeCount = types.filter((type) => type.active).length;
  return { rows: sorted.map(toIncidentTypeRow), activeCount, inactiveCount: types.length - activeCount };
}
