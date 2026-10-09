import type { ZoneType } from "@/lib/enums";
import type { ChipView } from "@/lib/incidents/types";
import type { LatLng } from "@/lib/patrols/types";

export interface RuleSummary {
  severity: ChipView;
  caption: string;
}

export interface ZoneRow {
  id: number;
  name: string;
  caption: string;
  rule: RuleSummary | null;
  rings: LatLng[][];
}

export interface RuleRow {
  zoneType: ZoneType;
  label: string;
  severity: ChipView | null;
  caption: string;
}

export interface ZonesView {
  rows: ZoneRow[];
  rules: RuleRow[];
  zoneCount: number;
  ruleCount: number;
  typeCount: number;
}
