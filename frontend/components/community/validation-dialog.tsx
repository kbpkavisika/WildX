"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { SEVERITIES, type Severity } from "@/lib/enums";
import type { CommunityReport } from "@/lib/api/community";

interface ValidationDialogProps {
  report: CommunityReport | null;
  open: boolean;
  onClose: () => void;
  onValidate: (id: number, severity: Severity) => void;
  loading: boolean;
}

export function ValidationDialog({ report, open, onClose, onValidate, loading }: ValidationDialogProps) {
  const [severity, setSeverity] = useState<Severity>(SEVERITIES.MEDIUM);

  if (!open || !report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onValidate(report.id, severity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-card-title font-semibold text-ink">Validate Report</h2>
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
            Validate report <strong className="font-semibold text-ink">{report.referenceCode}</strong> and set its
            urgency level. This transitions the report to a validated conflict case.
          </p>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="text-field-label text-ink-body">Severity</legend>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(SEVERITIES).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex min-h-12 items-center justify-center rounded-md border text-label font-medium transition-colors ${
                    severity === s
                      ? "border-primary bg-secondary-soft text-ink ring-2 ring-primary"
                      : "border-line bg-surface text-ink-body hover:bg-surface-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <Button type="submit" disabled={loading} className="disabled:opacity-60">
              {loading ? "Validating…" : "Confirm Validation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
