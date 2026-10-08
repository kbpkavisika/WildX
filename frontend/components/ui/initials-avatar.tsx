export function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[11px] font-semibold text-primary">
      {initials}
    </span>
  );
}
