"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Map, Settings } from "lucide-react";
import { useCan } from "@/hooks/use-can";
import { useParks } from "@/hooks/use-parks";

const ROW = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-body text-ink-body hover:bg-surface-muted";

export function ParkSwitcher() {
  const canSwitch = useCan("settings.manage");
  const { parks, current, switchTo } = useParks();
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;

  const choose = (parkId: number) => {
    setOpen(false);
    if (parkId !== current?.id) switchTo.mutate(parkId);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={!canSwitch}
        aria-expanded={canSwitch ? open : undefined}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-lg border border-line bg-card p-2.5 text-left enabled:cursor-pointer"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Map className="size-[18px]" strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="truncate text-label font-semibold text-ink">{current?.name ?? "…"}</span>
          <span className="text-caption text-ink-muted">{current?.code}</span>
        </span>
        {canSwitch && <Chevron className="size-4" strokeWidth={2} />}
      </button>
      {open && canSwitch && (
        <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-card p-1">
          {parks.map((park) => (
            <button key={park.id} type="button" onClick={() => choose(park.id)} className={ROW}>
              <span className="grow truncate">{park.name}</span>
              {park.id === current?.id && <Check className="size-4 text-primary" strokeWidth={2} />}
            </button>
          ))}
          <Link href="/dashboard/settings/parks" onClick={() => setOpen(false)} className={ROW}>
            <Settings className="size-4" strokeWidth={1.8} />
            Manage parks
          </Link>
        </div>
      )}
    </div>
  );
}
