"use client";

import { Bell, CircleHelp, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationsCard } from "@/components/notifications/notifications-card";
import { IconButton } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export function Topbar() {
  const pathname = usePathname();
  const { view } = useNotifications();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpenOn(null);
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      <div ref={menuRef} className="relative">
        <IconButton aria-label="Notifications" aria-expanded={open} onClick={() => setOpenOn(open ? null : pathname)}>
          <Bell strokeWidth={1.8} />
          {view && view.unreadCount > 0 && <span className="absolute top-[9px] right-2.5 size-2 rounded-full border-2 border-white bg-coral" />}
        </IconButton>
        {open && (
          <NotificationsCard className="absolute top-full right-0 z-50 mt-2 max-h-[70vh] w-[380px] max-w-[calc(100vw-56px)] overflow-y-auto shadow-float" />
        )}
      </div>
    </header>
  );
}
