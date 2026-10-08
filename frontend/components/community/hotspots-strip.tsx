"use client";

import { Flame } from "lucide-react";
import type { Hotspot } from "@/lib/api/community";
import { cn } from "@/lib/utils";

interface HotspotsStripProps {
  hotspots: Hotspot[];
}

export function HotspotsStrip({ hotspots }: HotspotsStripProps) {
  const activeHotspots = hotspots.filter((h) => h.isHotspot);
  if (activeHotspots.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-tertiary bg-[#FFF7F5] p-4 text-ink">
      <div className="flex items-center gap-2 text-tertiary-deep">
        <Flame className="size-5" strokeWidth={2.4} />
        <span className="text-form-title font-semibold">Active conflict hotspots · Last 30 days</span>
      </div>
      <div className="flex flex-wrap gap-2.5 pt-1">
        {activeHotspots.map((h) => (
          <div
            key={h.segmentId}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-[#F3C1BA] bg-white px-3 py-2",
              "text-body shadow-none"
            )}
          >
            <span className="font-semibold text-ink">{h.segmentName}</span>
            <span className="rounded-full bg-tertiary px-2 py-0.5 text-caption font-semibold text-white">
              {h.conflictCount} conflicts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
