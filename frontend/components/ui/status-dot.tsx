import { cn } from "@/lib/utils";

export type StatusTone = "positive" | "responding" | "negative";

const TONES: Record<StatusTone, string> = {
  positive: "text-positive",
  responding: "text-responding",
  negative: "text-negative",
};

export function StatusDot({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption whitespace-nowrap", TONES[tone])}>
      <span className="size-[7px] shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
