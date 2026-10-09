"use client";

import { useState } from "react";
import { Camera, Check, ExternalLink, MapPin, MessageSquare, PhoneCall, Send, X } from "lucide-react";
import { Can } from "@/components/auth/can";
import { formatAgo } from "@/lib/format";
import type { CommunityReport } from "@/lib/api/community";
import { EvidenceDialog } from "./evidence-dialog";

interface CommunityTableProps {
  reports: CommunityReport[];
  onOpenValidate: (report: CommunityReport) => void;
  onOpenInvalidate: (report: CommunityReport) => void;
  onOpenLocation: (report: CommunityReport) => void;
  onOpenDispatch: (report: CommunityReport) => void;
  emptyMessage?: string;
}

function StatusChip({ status, severity }: { status: string; severity?: string | null }) {
  switch (status) {
    case "NEW":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-[#FFF4ED] text-[#C2410C]">
          New
        </span>
      );
    case "NEEDS_LOCATION":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-negative-bg text-negative border border-negative-line">
          Needs location
        </span>
      );
    case "VALIDATED":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-secondary-soft text-primary">
          Validated {severity ? `· ${severity}` : ""}
        </span>
      );
    case "DISPATCHED":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-[#E8F6E6] text-positive">
          Dispatched
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-surface-muted text-ink-muted">
          Closed
        </span>
      );
    case "INVALID":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-surface-muted text-ink-muted line-through">
          Invalid
        </span>
      );
    case "DUPLICATE":
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-surface-muted text-ink-muted">
          Duplicate
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 text-caption font-medium bg-surface-sunken text-ink">
          {status}
        </span>
      );
  }
}

export function CommunityTable({
  reports,
  onOpenValidate,
  onOpenInvalidate,
  onOpenLocation,
  onOpenDispatch,
  emptyMessage,
}: CommunityTableProps) {
  const [evidenceReport, setEvidenceReport] = useState<CommunityReport | null>(null);
  const now = new Date();

  if (reports.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center p-8 text-center text-body text-ink-muted">
        {emptyMessage ?? "No community reports in this view."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body">
        <thead>
          <tr className="border-b border-line bg-surface-muted text-caption font-medium uppercase tracking-wider text-ink-muted">
            <th className="px-4 py-3">Report</th>
            <th className="px-4 py-3">Type & Count</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Reported</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {reports.map((report) => {
            const reportDate = new Date(report.createdAt);
            return (
              <tr key={report.id} className="hover:bg-surface-sunken/40">
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{report.referenceCode}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
                        {report.channel === "SMS" ? (
                          <MessageSquare className="size-3" />
                        ) : (
                          <PhoneCall className="size-3" />
                        )}
                        {report.channel}
                      </span>
                    </div>
                    {report.duplicateOfRef && (
                      <span className="text-caption text-ink-muted">
                        Duplicate of <strong className="text-ink">{report.duplicateOfRef}</strong>
                      </span>
                    )}
                    {report.reporterPhone && (
                      <span className="text-caption text-ink-muted font-mono">{report.reporterPhone}</span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-ink">{report.type}</span>
                    <span className="text-caption text-ink-muted">
                      {report.animalCount} animal{report.animalCount > 1 ? "s" : ""}
                    </span>
                    {report.description && (
                      <span className="line-clamp-1 max-w-xs text-caption text-ink-body">
                        {report.description}
                      </span>
                    )}
                    {report.photoPath && (
                      <button
                        type="button"
                        onClick={() => setEvidenceReport(report)}
                        className="mt-1 inline-flex items-center gap-1 self-start rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Camera className="size-3" />
                        View photo
                      </button>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    {report.segmentName ? (
                      <div className="flex items-center gap-1.5 text-ink-body">
                        <MapPin className="size-4 shrink-0 text-primary" />
                        <span className="font-medium text-ink">{report.segmentName}</span>
                        {report.segmentCode && (
                          <span className="rounded bg-surface-sunken px-1 text-caption font-mono text-ink-muted">
                            {report.segmentCode}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Can permission="community.act">
                        <button
                          type="button"
                          onClick={() => onOpenLocation(report)}
                          className="inline-flex items-center gap-1 self-start rounded border border-negative-line bg-negative-bg px-2 py-0.5 text-caption font-medium text-negative hover:underline"
                        >
                          <MapPin className="size-3" />
                          Assign segment
                        </button>
                      </Can>
                    )}
                    {report.lat !== null && report.lng !== null && (
                      <a
                        href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="size-3" />
                        <span>{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
                      </a>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-caption text-ink-muted whitespace-nowrap">
                  {formatAgo(reportDate, now)}
                </td>

                <td className="px-4 py-3.5">
                  <StatusChip status={report.status} severity={report.severity} />
                  {report.invalidReason && (
                    <p className="mt-1 max-w-xs text-caption text-negative line-clamp-1">
                      Reason: {report.invalidReason}
                    </p>
                  )}
                  {report.outcome && (
                    <p className="mt-1 max-w-xs text-caption text-positive line-clamp-1">
                      Outcome: {report.outcome}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Can permission="community.act">
                      {report.status === "NEEDS_LOCATION" && (
                        <button
                          type="button"
                          onClick={() => onOpenLocation(report)}
                          className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-caption font-medium text-ink hover:bg-surface-muted"
                        >
                          Set location
                        </button>
                      )}

                      {report.status === "NEW" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenValidate(report)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-caption font-medium text-white hover:bg-primary-hover"
                          >
                            <Check className="size-3.5" />
                            Validate
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenInvalidate(report)}
                            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-caption font-medium text-ink-muted hover:bg-surface-muted hover:text-negative"
                          >
                            <X className="size-3.5" />
                            Invalid
                          </button>
                        </>
                      )}
                    </Can>

                    <Can permission="dispatch.create">
                      {report.status === "VALIDATED" && (
                        <button
                          type="button"
                          onClick={() => onOpenDispatch(report)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-caption font-medium text-white hover:bg-primary-hover"
                        >
                          <Send className="size-3.5" />
                          Dispatch responder
                        </button>
                      )}
                    </Can>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <EvidenceDialog
        report={evidenceReport}
        open={Boolean(evidenceReport)}
        onOpenChange={(open) => {
          if (!open) setEvidenceReport(null);
        }}
      />
    </div>
  );
}
