import { cn } from "@/lib/utils";
import { TRACK_STYLES } from "./track-styles";

export function PatrolBadge({ number, colorIndex }: { number: number; colorIndex: number }) {
  return (
    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-white", TRACK_STYLES[colorIndex].fill)}>
      {number}
    </span>
  );
}
