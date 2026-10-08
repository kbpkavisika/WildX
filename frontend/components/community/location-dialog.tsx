"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { fetchPublicSegments, type BoundarySegment } from "@/lib/api/public-report";
import type { CommunityReport } from "@/lib/api/community";

interface LocationDialogProps {
  report: CommunityReport | null;
  open: boolean;
  onClose: () => void;
  onUpdateLocation: (id: number, segmentId: number, landmarkCode?: string) => void;
  loading: boolean;
}

export function LocationDialog({ report, open, onClose, onUpdateLocation, loading }: LocationDialogProps) {
  const [segments, setSegments] = useState<BoundarySegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchPublicSegments(1)
      .then((data) => {
        setSegments(data);
        if (data.length > 0 && !selectedSegmentId) {
          setSelectedSegmentId(data[0].id);
        }
      })
      .catch(() => {});
  }, [selectedSegmentId]);

  if (!open || !report) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSegmentId) {
      const seg = segments.find((s) => s.id === selectedSegmentId);
      onUpdateLocation(report.id, selectedSegmentId, seg?.code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-card-title font-semibold text-ink">Assign Boundary Segment</h2>
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
            Report <strong className="font-semibold text-ink">{report.referenceCode}</strong> requires location
            clarification. Select the nearest boundary segment or landmark.
          </p>

          {report.rawText && (
            <div className="rounded-md bg-surface-sunken p-3 text-caption">
              <span className="font-medium text-ink-muted">Raw inbound SMS:</span>
              <p className="mt-1 font-mono font-medium text-ink">{report.rawText}</p>
            </div>
          )}

          <Field label="Boundary segment / Landmark">
            <select
              value={selectedSegmentId ?? ""}
              onChange={(e) => setSelectedSegmentId(Number(e.target.value))}
              className={fieldClass(false)}
            >
              {segments.map((seg) => (
                <option key={seg.id} value={seg.id}>
                  {seg.name} ({seg.code})
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-2 flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <Button type="submit" disabled={loading || !selectedSegmentId} className="disabled:opacity-60">
              {loading ? "Assigning…" : "Assign Location"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
