"use client";

import { ConflictChart } from "@/components/dashboard/conflict-chart";
import { ParkActivity } from "@/components/dashboard/park-activity";
import { PatrolSchedule } from "@/components/dashboard/patrol-schedule";
import { PageHeader } from "@/components/layout/page-header";
import { useDashboard } from "@/hooks/use-dashboard";
import { useParks } from "@/hooks/use-parks";

export default function DashboardPage() {
  const { data, isPending, isError } = useDashboard();
  const { current } = useParks();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          data && (
            <>
              <strong className="font-semibold text-ink">{data.greeting}</strong> here&apos;s what&apos;s happening in {current?.name ?? "your park"} today.
            </>
          )
        }
      />
      {isPending && <p className="text-body text-ink-muted">Loading park activity…</p>}
      {isError && <p className="text-body text-negative">Could not load the dashboard. Retrying.</p>}
      {data && (
        <>
          <ParkActivity date={data.today} metrics={data.metrics} />
          <div className="flex flex-wrap gap-5">
            <ConflictChart chart={data.conflict} />
            <PatrolSchedule today={new Date()} groups={data.schedule} />
          </div>
        </>
      )}
    </>
  );
}
