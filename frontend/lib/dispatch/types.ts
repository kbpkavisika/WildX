export type PresenceTone = "positive" | "negative";

export interface ResponderOption {
  id: number;
  name: string;
  initials: string;
  distance: string;
  presence: { tone: PresenceTone; label: string };
}
