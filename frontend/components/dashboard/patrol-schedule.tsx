import { Moon, Target, type LucideIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { MoreButton } from "@/components/ui/more-button";
import { SCHEDULE_KINDS, type ScheduleGroup, type ScheduleItem, type ScheduleKind } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { WeekStrip } from "./week-strip";

const KIND_STYLE: Record<ScheduleKind, { icon: LucideIcon; className: string }> = {
  [SCHEDULE_KINDS.PATROL]: { icon: Moon, className: "bg-butter" },
  [SCHEDULE_KINDS.MAINTENANCE]: { icon: Target, className: "bg-orchid" },
};

function DayDivider({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 text-caption text-ink-muted">
      {label}
      <span className="grow border-t border-dashed border-line" />
    </span>
  );
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const { icon: Icon, className } = KIND_STYLE[item.kind];
  return (
    <div className={cn("flex items-center gap-3 rounded-lg p-3", className)}>
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="text-label">{item.title}</span>
        <span className="text-caption text-ink-body">{item.meta}</span>
      </span>
      <MoreButton label="Patrol options" className="size-7" />
    </div>
  );
}

interface PatrolScheduleProps {
  today: Date;
  groups: ScheduleGroup[];
}

export function PatrolSchedule({ today, groups }: PatrolScheduleProps) {
  return (
    <Card label="Patrol schedule" className="relative flex-[2_1_340px] gap-4 px-5">
      <CardTitle>Patrol schedule</CardTitle>
      <WeekStrip today={today} />
      <div className="flex flex-col gap-2.5">
        {groups.map((group) => (
          <div key={group.label} className="contents">
            <DayDivider label={group.label} />
            {group.items.map((item) => (
              <ScheduleRow key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
