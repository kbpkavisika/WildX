import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import type { RangerPatrolCard } from "@/lib/patrols/types";

export function RangerPatrolList({ cards }: { cards: RangerPatrolCard[] }) {
  return (
    <div className="flex flex-col gap-3">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/ranger/patrol/${card.id}`}
          className="flex min-h-12 flex-col gap-1.5 rounded-xl border border-line bg-card p-4 hover:bg-surface-muted"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="text-label text-ink">{card.title}</span>
            <Chip tone={card.status.tone}>{card.status.label}</Chip>
          </span>
          <span className="text-caption text-ink-muted">{card.caption}</span>
        </Link>
      ))}
    </div>
  );
}
