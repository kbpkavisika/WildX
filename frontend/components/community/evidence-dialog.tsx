"use client";

import { useState } from "react";
import { Camera, Download, Loader2, X, ImageOff, Phone, Calendar } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { useCommunityReportPhoto } from "@/hooks/use-community-report-photo";
import { fetchCommunityReportPhoto, type CommunityReport } from "@/lib/api/community";
import { downloadBlob } from "@/lib/files";

interface EvidenceDialogProps {
  report: CommunityReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidenceDialog({ report, open, onOpenChange }: EvidenceDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const { photoUrl, photoLoading, photoError } = useCommunityReportPhoto(
    report?.id ?? null,
    Boolean(report?.photoPath) && open
  );

  if (!open || !report) return null;

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const blob = await fetchCommunityReportPhoto(report.id, report.parkId);
      downloadBlob(blob, `${report.referenceCode}-evidence.jpg`);
    } catch {
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl transition-all sm:p-7">
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Camera className="size-4" />
              </span>
              <h2 className="text-section-title font-semibold text-ink">
                Photo Evidence &middot; {report.referenceCode}
              </h2>
            </div>
            <p className="text-caption text-ink-muted">
              Submitted via {report.channel} &bull; Type: {report.type} ({report.animalCount} animal{report.animalCount > 1 ? "s" : ""})
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="flex size-11 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="my-5 overflow-hidden rounded-xl border border-line bg-surface-sunken">
          {photoLoading ? (
            <div className="flex h-72 w-full flex-col items-center justify-center gap-2 text-ink-muted">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-body font-medium">Loading high-resolution evidence...</span>
            </div>
          ) : photoError || !photoUrl ? (
            <div className="flex h-72 w-full flex-col items-center justify-center gap-2 text-ink-muted">
              <ImageOff className="size-10 text-ink-faint" />
              <span className="text-body font-medium">Unable to load evidence photo</span>
              <span className="text-caption text-ink-faint">The file may have been moved or removed from storage</span>
            </div>
          ) : (
            <div className="relative flex max-h-[60vh] w-full items-center justify-center bg-black/95">
              <img
                src={photoUrl}
                alt={`Evidence photo for report ${report.referenceCode}`}
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-muted p-3 text-caption text-ink-body">
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-primary" />
            <span>Reporter: <strong className="font-mono text-ink">{report.reporterPhone || "Unknown"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-primary" />
            <span>Date: <strong className="text-ink">{new Date(report.createdAt).toLocaleString()}</strong></span>
          </div>
          {report.description && (
            <div className="col-span-2 pt-1 border-t border-line text-caption text-ink-muted">
              <strong className="text-ink">Description:</strong> {report.description}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <SecondaryButton
            onClick={handleDownload}
            disabled={downloading || photoLoading || !photoUrl}
            className="h-11 gap-1.5 px-4 font-medium"
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download
          </SecondaryButton>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 bg-primary px-5 font-semibold text-white hover:bg-primary-hover"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
