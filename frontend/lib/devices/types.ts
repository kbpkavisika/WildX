import { DEVICE_TYPES } from "@/lib/enums";
import type { ChipView } from "@/lib/incidents/types";

export const DEVICE_FILTERS = { ALL: "ALL", ...DEVICE_TYPES } as const;
export type DeviceFilter = (typeof DEVICE_FILTERS)[keyof typeof DEVICE_FILTERS];

export interface DeviceRow {
  id: number;
  code: string;
  kind: string;
  place: string;
  placeCaption: string;
  interval: string;
  battery: string;
  lastSeen: string;
  health: ChipView;
}

export interface DeviceFilterOption {
  value: DeviceFilter;
  label: string;
  count: number;
}

export interface DevicesView {
  rows: DeviceRow[];
  filters: DeviceFilterOption[];
  collarCount: number;
  cameraCount: number;
  attentionCount: number;
}
