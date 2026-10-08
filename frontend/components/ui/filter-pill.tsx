import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}

export function FilterPill({ label, count, pressed, onClick }: FilterPillProps) {
  return (
    <button
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-3 text-field-label font-normal",
        pressed ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-body hover:bg-surface-muted",
      )}
    >
      {label}
      <span className="text-caption opacity-70">{count}</span>
    </button>
  );
}
