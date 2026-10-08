"use client";

import { useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { HotspotsStrip } from "@/components/community/hotspots-strip";
import { CommunityTable } from "@/components/community/community-table";
import { ValidationDialog } from "@/components/community/validation-dialog";
import { InvalidationDialog } from "@/components/community/invalidation-dialog";
import { LocationDialog } from "@/components/community/location-dialog";
import { CommunityDispatchDialog } from "@/components/community/dispatch-dialog";
import { SmsHelpCardDialog } from "@/components/community/sms-help-card-dialog";
import { useCommunityReports } from "@/hooks/use-community-reports";
import type { CommunityReport } from "@/lib/api/community";
import type { Severity } from "@/lib/enums";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "NEEDS_LOCATION", label: "Needs location" },
  { value: "VALIDATED", label: "Validated" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DUPLICATE", label: "Duplicates" },
  { value: "CLOSED", label: "Closed" },
  { value: "INVALID", label: "Invalid" },
];

export default function CommunityDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { reports, hotspots, validate, invalidate, updateLocation } = useCommunityReports(selectedStatus);

  const [activeReport, setActiveReport] = useState<CommunityReport | null>(null);
  const [validateOpen, setValidateOpen] = useState<boolean>(false);
  const [invalidateOpen, setInvalidateOpen] = useState<boolean>(false);
  const [locationOpen, setLocationOpen] = useState<boolean>(false);
  const [dispatchOpen, setDispatchOpen] = useState<boolean>(false);
  const [helpCardOpen, setHelpCardOpen] = useState<boolean>(false);

  const reportList = reports.data ?? [];
  const newCount = reportList.filter((r) => r.status === "NEW").length;
  const needsLocationCount = reportList.filter((r) => r.status === "NEEDS_LOCATION").length;

  const handleOpenValidate = (report: CommunityReport) => {
    setActiveReport(report);
    setValidateOpen(true);
  };

  const handleOpenInvalidate = (report: CommunityReport) => {
    setActiveReport(report);
    setInvalidateOpen(true);
  };

  const handleOpenLocation = (report: CommunityReport) => {
    setActiveReport(report);
    setLocationOpen(true);
  };

  const handleOpenDispatch = (report: CommunityReport) => {
    setActiveReport(report);
    setDispatchOpen(true);
  };

  const handleValidateSubmit = (id: number, severity: Severity) => {
    validate.mutate(
      { id, severity },
      {
        onSuccess: () => {
          setValidateOpen(false);
          setActiveReport(null);
        },
      }
    );
  };

  const handleInvalidateSubmit = (id: number, reason: string) => {
    invalidate.mutate(
      { id, reason },
      {
        onSuccess: () => {
          setInvalidateOpen(false);
          setActiveReport(null);
        },
      }
    );
  };

  const handleLocationSubmit = (id: number, segmentId: number, landmarkCode?: string) => {
    updateLocation.mutate(
      { id, segmentId, landmarkCode },
      {
        onSuccess: () => {
          setLocationOpen(false);
          setActiveReport(null);
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Community reports"
        subtitle={
          <>
            <strong className="font-semibold text-ink">
              {newCount} new
              {needsLocationCount > 0 ? `, ${needsLocationCount} need location` : ""}
            </strong>{" "}
            in the CLO review queue.
          </>
        }
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setHelpCardOpen(true)} className="gap-2">
              <Printer className="size-4" />
              <span>SMS help card</span>
            </Button>
          </div>
        }
      />

      <HotspotsStrip hotspots={hotspots.data ?? []} />

      <Card label="Community reports review queue">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.value === "ALL"
                  ? reportList.length
                  : reportList.filter((r) => r.status === filter.value).length;
              return (
                <FilterPill
                  key={filter.value}
                  label={filter.label}
                  count={count}
                  pressed={selectedStatus === filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => reports.refetch()}
            disabled={reports.isFetching}
            className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink-muted hover:bg-surface-muted hover:text-ink disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${reports.isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {reports.isPending && <p className="py-8 text-center text-body text-ink-muted">Loading reports…</p>}
        {reports.isError && (
          <p className="py-8 text-center text-body text-negative">Could not load community reports. Retrying.</p>
        )}

        {reports.data && (
          <CommunityTable
            reports={reports.data}
            onOpenValidate={handleOpenValidate}
            onOpenInvalidate={handleOpenInvalidate}
            onOpenLocation={handleOpenLocation}
            onOpenDispatch={handleOpenDispatch}
          />
        )}
      </Card>

      <ValidationDialog
        open={validateOpen}
        report={activeReport}
        onClose={() => setValidateOpen(false)}
        onValidate={handleValidateSubmit}
        loading={validate.isPending}
      />

      <InvalidationDialog
        open={invalidateOpen}
        report={activeReport}
        onClose={() => setInvalidateOpen(false)}
        onInvalidate={handleInvalidateSubmit}
        loading={invalidate.isPending}
      />

      <LocationDialog
        open={locationOpen}
        report={activeReport}
        onClose={() => setLocationOpen(false)}
        onUpdateLocation={handleLocationSubmit}
        loading={updateLocation.isPending}
      />

      <CommunityDispatchDialog
        open={dispatchOpen}
        report={activeReport}
        onClose={() => setDispatchOpen(false)}
        onDispatched={() => {
          reports.refetch();
        }}
      />

      <SmsHelpCardDialog open={helpCardOpen} onClose={() => setHelpCardOpen(false)} />
    </>
  );
}
