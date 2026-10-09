import { RangerAlertList } from "@/components/alerts/ranger-alert-list";
import { NotificationsCard } from "@/components/notifications/notifications-card";
import { Notice } from "@/components/ui/notice";
import { PageHeader, Strong } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { useRangerAlerts } from "@/hooks/use-ranger-alerts";

export default function RangerAlertsScreen() {
  const { isPending, isError, isRefetching, refetch, view, acknowledge, resolve } = useRangerAlerts();

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <PageHeader
        title="Alerts"
        subtitle={view && <><Strong>{view.openCount} open</Strong>, {view.acknowledgedCount} acknowledged.</>}
      />
      {isPending && <Notice tone="muted">Loading alerts…</Notice>}
      {isError && <Notice tone="negative">Could not load alerts. Retrying.</Notice>}
      {view && <RangerAlertList view={view} actions={{ acknowledge, resolve }} />}
      <NotificationsCard />
    </Screen>
  );
}
