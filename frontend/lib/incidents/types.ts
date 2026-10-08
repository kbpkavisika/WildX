import type { ChipTone } from "@/lib/dashboard/types";

export interface ChipView {
  tone: ChipTone;
  label: string;
}

export interface IncidentTypeRow {
  id: number;
  name: string;
  severity: ChipView;
  status: ChipView;
}

export interface IncidentTypesView {
  rows: IncidentTypeRow[];
  activeCount: number;
  inactiveCount: number;
}
