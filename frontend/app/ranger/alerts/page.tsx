"use client";

import { RangerAlertList } from "@/components/alerts/ranger-alert-list";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsCard } from "@/components/notifications/notifications-card";
import { useRangerAlerts } from "@/hooks/use-ranger-alerts";

export default function RangerAlertsPage() {
  const { isPending, isError, view } = useRangerAlerts();

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle={
          view && (
            <>
              <strong className="font-semibold text-ink">{view.openCount} open</strong>, {view.acknowledgedCount} acknowledged.
            </>
          )
        }
      />
      {isPending && <p className="m-0 text-body text-ink-muted">Loading alerts…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load alerts. Retrying.</p>}
      {view && <RangerAlertList view={view} />}
      <NotificationsCard className="px-4 py-4" />
    </>
  );
}
