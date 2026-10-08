"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAYS_IN_WEEK } from "@/lib/constants";
import { weekOf } from "@/lib/dashboard/mappers";
import { formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";

const ARROW = "flex size-[30px] cursor-pointer items-center justify-center rounded-sm border border-line bg-card text-ink";

export function WeekStrip({ today }: { today: Date }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const anchor = new Date(today);
  anchor.setDate(today.getDate() + weekOffset * DAYS_IN_WEEK);
  const days = weekOf(anchor, today);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="mr-auto text-label">{formatMonthYear(anchor)}</span>
        <button aria-label="Previous week" className={ARROW} onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="size-3.5" strokeWidth={2} />
        </button>
        <button aria-label="Next week" className={ARROW} onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <span key={`w-${d.weekday}`} className="text-caption text-ink-muted">
            {d.weekday}
          </span>
        ))}
        {days.map((d) => (
          <span key={`d-${d.weekday}`} className="flex h-[34px] items-center justify-center">
            <span
              aria-current={d.isToday ? "date" : undefined}
              className={cn("flex size-[34px] items-center justify-center rounded-full text-body", d.isToday && "bg-lime-soft font-semibold text-primary")}
            >
              {d.day}
            </span>
          </span>
        ))}
      </div>
    </>
  );
}
