import { Bell, CircleHelp, Search } from "lucide-react";
import { IconButton } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line px-7 py-4">
      <label className="mr-auto flex h-10 w-[280px] max-w-full items-center gap-2.5 rounded-md border border-line bg-card pr-2.5 pl-3">
        <Search className="size-[18px] shrink-0 text-ink-muted" strokeWidth={2} />
        <input type="search" placeholder="Search" aria-label="Search" className="min-w-0 grow bg-transparent text-body text-ink outline-none placeholder:text-ink-muted" />
        <span className="shrink-0 rounded-xs bg-surface-sunken px-1.5 whitespace-nowrap py-0.5 text-caption text-ink-muted">⌘ K</span>
      </label>
      <IconButton aria-label="Help">
        <CircleHelp strokeWidth={1.8} />
      </IconButton>
      <IconButton aria-label="Notifications">
        <Bell strokeWidth={1.8} />
        <span className="absolute top-[9px] right-2.5 size-2 rounded-full border-2 border-white bg-coral" />
      </IconButton>
    </header>
  );
}
