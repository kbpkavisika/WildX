"use client";

import { PageHeader } from "@/components/layout/page-header";
import { RangerPatrolList } from "@/components/patrols/ranger-patrol-list";
import { useMyPatrols } from "@/hooks/use-my-patrols";
import { counted } from "@/lib/devices/mappers";
import { toRangerPatrolCards } from "@/lib/patrols/ranger-mappers";

export default function RangerPatrolsPage() {
  const { isPending, isError, data } = useMyPatrols();
  const cards = data && toRangerPatrolCards(data, new Date());

  function subtitle() {
    if (!cards) return undefined;
    if (cards.length === 0) return "No patrols assigned for today.";
    return <><strong className="font-semibold text-ink">{counted(cards.length, "patrol", "patrols")}</strong> today.</>;
  }

  return (
    <>
      <PageHeader title="Patrols" subtitle={subtitle()} />
      {isPending && <p className="m-0 text-body text-ink-muted">Loading your patrols…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load your patrols. Retrying.</p>}
      {cards && <RangerPatrolList cards={cards} />}
    </>
  );
}
