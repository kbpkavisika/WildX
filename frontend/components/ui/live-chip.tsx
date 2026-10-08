import { Chip } from "./chip";

export function LiveChip() {
  return (
    <Chip tone="positive" className="gap-1.5 px-2 font-medium">
      <span className="size-[7px] rounded-full bg-online motion-safe:animate-live" />
      Live
    </Chip>
  );
}
