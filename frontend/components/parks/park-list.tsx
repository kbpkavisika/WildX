import { QuietButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { ParkResponse } from "@/lib/api/parks";
import { counted } from "@/lib/devices/mappers";

interface ParkListProps {
  parks: ParkResponse[];
  currentId: number | null;
  switching: boolean;
  onSwitch: (id: number) => void;
}

export function ParkList({ parks, currentId, switching, onSwitch }: ParkListProps) {
  return (
    <div className="flex flex-col gap-1">
      {parks.map((park) => (
        <div key={park.id} className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-muted">
          <span className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-label text-ink">{park.name}</span>
            <span className="text-caption text-ink-muted">
              {park.code} · Neglected after {counted(park.neglectDays, "day", "days")}
            </span>
          </span>
          {park.id === currentId ? (
            <Chip tone="positive">Current</Chip>
          ) : (
            <QuietButton onClick={() => onSwitch(park.id)} disabled={switching} className="shrink-0 disabled:opacity-60">
              Switch
            </QuietButton>
          )}
        </div>
      ))}
    </div>
  );
}
