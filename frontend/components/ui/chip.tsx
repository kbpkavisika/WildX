import type { ChipTone } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const TONES: Record<ChipTone, string> = {
  positive: "bg-positive-bg text-positive border-positive-line",
  negative: "bg-negative-bg text-negative border-negative-line",
  neutral: "bg-surface-muted text-ink-body border-line",
  done: "bg-lime-soft text-primary border-lime-soft",
};

interface ChipProps {
  tone: ChipTone;
  className?: string;
  children: React.ReactNode;
}

export function Chip({ tone, className, children }: ChipProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-caption", TONES[tone], className)}>
      {children}
    </span>
  );
}
