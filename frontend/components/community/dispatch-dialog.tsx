"use client";

import { ExternalLink, X } from "lucide-react";
import { DispatchForm } from "@/components/dispatch/dispatch-form";
import type { CommunityReport } from "@/lib/api/community";
import type { DispatchResponse } from "@/lib/api/dispatches";
import { SOURCE_TYPES } from "@/lib/enums";

interface CommunityDispatchDialogProps {
  report: CommunityReport | null;
  open: boolean;
  onClose: () => void;
  onDispatched: (res: DispatchResponse) => void;
}

export function CommunityDispatchDialog({ report, open, onClose, onDispatched }: CommunityDispatchDialogProps) {
  if (!open || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-card-title font-semibold text-ink">Dispatch Ranger</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-ink-muted">
              <span>Report <strong className="text-ink">{report.referenceCode}</strong></span>
              <span>·</span>
              <span>{report.segmentName || "No segment"}</span>
              {report.lat !== null && report.lng !== null && (
                <>
                  <span>·</span>
                  <a
                    href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono font-medium text-primary hover:underline"
                    title="Open exact coordinates in Google Maps"
                  >
                    <ExternalLink className="size-3" />
                    <span>{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
                  </a>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4">
          <DispatchForm
            source={{ type: SOURCE_TYPES.COMMUNITY_REPORT, id: report.id }}
            position={report.lat && report.lng ? [report.lat, report.lng] : null}
            onDispatched={(res) => {
              onDispatched(res);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
