"use client";

import dynamic from "next/dynamic";
import { AlertDetail } from "@/components/alerts/alert-detail";
import { AlertList } from "@/components/alerts/alert-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { LiveChip } from "@/components/ui/live-chip";
import { useAlerts } from "@/hooks/use-alerts";
import { EMPTY_ALERTS } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import { ALERT_FILTERS, type AlertFilter, type AlertsView } from "@/lib/alerts/types";

const AlertMap = dynamic(() => import("@/components/alerts/alert-map"), { ssr: false });

function Summary({ view }: { view: AlertsView }) {
  return (
    <>
      <strong className="font-semibold text-ink">{view.openCount} open</strong>
      {view.escalatedCount > 0 ? `, ${view.escalatedCount} escalated past the acknowledge time.` : "."}
    </>
  );
}

function emptyLabel(view: AlertsView, filter: AlertFilter): string {
  if (filter === ALERT_FILTERS.ALL) return "No alerts yet.";
  const option = view.filters.find((item) => item.value === filter);
  return `No ${option?.label.toLowerCase() ?? ""} alerts.`;
}

export default function AlertsPage() {
  const { signedIn, hasPark, isPending, isError, view } = useAlerts();
  const { filter, setFilter } = useAlertsPage();

  function subtitle() {
    if (!signedIn) return "Sign in to see alerts.";
    if (!hasPark) return "Your account is not linked to a park.";
    if (isError) return <span className="text-negative">Could not load alerts. Retrying.</span>;
    if (isPending || !view) return "Loading alerts…";
    return <Summary view={view} />;
  }

  return (
    <>
      <PageHeader title="Alerts" badge={<LiveChip />} subtitle={subtitle()} />
      {hasPark && <AlertMap view={view ?? EMPTY_ALERTS} />}
      {view && (
        <div className="flex flex-wrap items-start gap-5">
          <Card label="Alert queue" className="flex-[3_1_420px]">
            <div className="flex flex-wrap items-center gap-2">
              {view.filters.map((option) => (
                <FilterPill
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                />
              ))}
            </div>
            <AlertList rows={view.rows} emptyLabel={emptyLabel(view, filter)} />
          </Card>
          <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
            <AlertDetail view={view.selected} />
          </div>
        </div>
      )}
    </>
  );
}
