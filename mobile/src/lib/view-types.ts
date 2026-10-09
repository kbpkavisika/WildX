export type ChipTone = "positive" | "negative" | "neutral" | "done";

export type StatusTone = "positive" | "responding" | "negative";

export interface ChipView {
  tone: ChipTone;
  label: string;
}

export interface StatusView {
  tone: StatusTone;
  label: string;
}

export interface DetailFact {
  label: string;
  value: string;
}

export interface TaskRow {
  key: string;
  dispatchId: number | null;
  mapsUrl: string | null;
  title: string;
  caption: string;
  status: ChipView;
}

export const NO_VALUE = "—";
