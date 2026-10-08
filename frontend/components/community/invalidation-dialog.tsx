"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import type { CommunityReport } from "@/lib/api/community";

interface InvalidationDialogProps {
  report: CommunityReport | null;
  open: boolean;
  onClose: () => void;
  onInvalidate: (id: number, reason: string) => void;
  loading: boolean;
}

export function InvalidationDialog({ report, open, onClose, onInvalidate, loading }: InvalidationDialogProps) {
  const [reason, setReason] = useState<string>("");

  if (!open || !report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onInvalidate(report.id, reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-card-title font-semibold text-ink">Invalidate Report</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <p className="text-body text-ink-body">
            Mark report <strong className="font-semibold text-ink">{report.referenceCode}</strong> as invalid. Please
            specify the reason (e.g. false alarm, unconfirmed sighting, test message).
          </p>

          <Field label="Reason for invalidation">
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Insufficient evidence or false sighting"
              className={fieldClass(false)}
            />
          </Field>

          <div className="mt-2 flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <Button
              type="submit"
              disabled={loading || !reason.trim()}
              className="bg-negative hover:bg-negative/90 disabled:opacity-60"
            >
              {loading ? "Invalidating…" : "Invalidate Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
