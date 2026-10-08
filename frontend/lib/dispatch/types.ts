import type { ChipView, DetailFact } from "@/lib/incidents/types";

export type PresenceTone = "positive" | "negative";

export interface ResponderOption {
  id: number;
  name: string;
  initials: string;
  distance: string;
  presence: { tone: PresenceTone; label: string };
}

export interface TaskRow {
  id: number;
  href: string | null;
  title: string;
  caption: string;
  status: ChipView;
}

export interface DispatchView {
  id: number;
  title: string;
  incidentId: number | null;
  status: ChipView;
  facts: DetailFact[];
  canAcknowledge: boolean;
  canComplete: boolean;
  canDecline: boolean;
}
