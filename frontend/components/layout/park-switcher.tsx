import { ChevronDown, Map } from "lucide-react";

export function ParkSwitcher() {
  return (
    <button className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-card p-2.5 text-left">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted">
        <Map className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-label font-semibold text-ink">Udawalawe NP</span>
        <span className="text-caption text-ink-muted">30,821 ha</span>
      </span>
      <ChevronDown className="size-4" strokeWidth={2} />
    </button>
  );
}
