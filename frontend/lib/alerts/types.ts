import type { StatusTone } from "@/components/ui/status-dot";
import { ALERT_STATUSES } from "@/lib/enums";
import type { ChipView } from "@/lib/incidents/types";
import type { LatLng, SectorShape } from "@/lib/patrols/types";

export const ALERT_FILTERS = { ...ALERT_STATUSES, ALL: "ALL" } as const;
export type AlertFilter = (typeof ALERT_FILTERS)[keyof typeof ALERT_FILTERS];

export interface AlertStatusView {
  tone: StatusTone;
  label: string;
}

export interface AlertRow {
  id: number;
  number: number;
  title: string;
  caption: string;
  severity: ChipView;
  status: AlertStatusView;
  position: LatLng | null;
}

export interface AlertFilterOption {
  value: AlertFilter;
  label: string;
  count: number;
}

export interface AlertsView {
  rows: AlertRow[];
  filters: AlertFilterOption[];
  zones: SectorShape[];
  openCount: number;
  escalatedCount: number;
}
