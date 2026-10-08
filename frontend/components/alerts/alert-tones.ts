import type { StatusTone } from "@/components/ui/status-dot";

export const ALERT_TONE_STYLES: Record<StatusTone, { fill: string; halo: string }> = {
  negative: { fill: "bg-negative", halo: "bg-negative/20" },
  responding: { fill: "bg-responding", halo: "bg-responding/20" },
  positive: { fill: "bg-positive", halo: "bg-positive/20" },
};
