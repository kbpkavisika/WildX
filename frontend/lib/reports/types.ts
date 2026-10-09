export const TREND_UNITS = ["day", "week", "month"] as const;

export type TrendUnit = (typeof TREND_UNITS)[number];

export interface DayCount {
  date: string;
  count: number;
}

export interface TrendBar {
  key: string;
  label: string;
  tooltip: string;
  heightPct: number;
  averagePct: number;
}

export interface TrendView {
  bars: TrendBar[];
  axis: { index: number; label: string }[];
  total: number;
  change: string | null;
  changeCaption: string;
}

export type HighlightIcon = "total" | "top" | "place" | "warning" | "time";

export interface Highlight {
  title: string;
  value: string;
  caption: string;
  icon: HighlightIcon;
}

export interface ShareRow {
  key: string;
  label: string;
  initials: string;
  pct: number;
}

export interface NamedCount {
  key: string;
  label: string;
  count: number;
}
