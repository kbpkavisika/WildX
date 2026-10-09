import { RangerPatrolList } from "@/components/patrols/ranger-patrol-list";
import { Notice } from "@/components/ui/notice";
import { PageHeader, Strong } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { useMyPatrols } from "@/hooks/use-my-patrols";
import { counted } from "@/lib/format";
import { toRangerPatrolCards } from "@/lib/patrols/mappers";

export default function RangerPatrolsScreen() {
  const { patrols, isPending, isError, isRefetching, refetch } = useMyPatrols();
  const cards = patrols && toRangerPatrolCards(patrols, new Date());

  function subtitle() {
    if (!cards) return undefined;
    if (cards.length === 0) return "No patrols assigned for today.";
    return <><Strong>{counted(cards.length, "patrol", "patrols")}</Strong> today.</>;
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <PageHeader title="Patrols" subtitle={subtitle()} />
      {isPending && <Notice tone="muted">Loading your patrols…</Notice>}
      {isError && !cards && <Notice tone="negative">Could not load your patrols. Retrying.</Notice>}
      {cards && <RangerPatrolList cards={cards} />}
    </Screen>
  );
}
