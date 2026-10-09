"use client";

import { useState } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useLogout } from "@/hooks/use-logout";
import { useAuthStore } from "@/lib/auth/store";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { initialsOf } from "@/lib/format";

export function UserCard() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  if (user === null) return null;
  return (
    <div className="flex shrink-0 flex-col gap-1">
      {open && (
        <button
          type="button"
          onClick={logout}
          className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 text-left text-nav text-ink-body hover:bg-surface-muted"
        >
          <LogOut className="size-5 shrink-0" strokeWidth={1.8} />
          Log out
        </button>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2.5 border-t border-line px-2.5 py-3 text-left"
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-field-label font-semibold text-lime">
          {initialsOf(user.name)}
          <span className="absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-white bg-online" />
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="truncate text-label text-ink">{user.name}</span>
          <span className="text-caption text-ink-muted">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronsUpDown className="size-4 text-ink-muted" strokeWidth={2} />
      </button>
    </div>
  );
}
