"use client";

import { Plus } from "lucide-react";
import { ConflictChart } from "@/components/dashboard/conflict-chart";
import { ParkActivity } from "@/components/dashboard/park-activity";
import { PatrolSchedule } from "@/components/dashboard/patrol-schedule";
import { PageHeader } from "@/components/layout/page-header";
import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isPending, isError } = useDashboard();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          data && (
            <>
              <strong className="font-semibold text-ink">{data.greeting}</strong> here&apos;s what&apos;s happening in {data.parkName} today.
            </>
          )
        }
        action={
          <Can permission="incident.report">
            <Button>
              <Plus className="size-[18px]" strokeWidth={2} />
              Report incident
            </Button>
          </Can>
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
