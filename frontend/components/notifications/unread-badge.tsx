export function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-coral px-1.5 text-caption font-semibold text-primary-foreground"
    >
      {count}
    </span>
  );
}
