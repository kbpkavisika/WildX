"use client";

import { X } from "lucide-react";
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
            <p className="text-caption text-ink-muted">
              Report <strong className="text-ink">{report.referenceCode}</strong> · {report.segmentName || "No segment"}
            </p>
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
