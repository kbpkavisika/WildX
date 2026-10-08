"use client";

import { Printer, X } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/button";
import { useSmsHelpCardQuery } from "@/hooks/use-community-reports";

interface SmsHelpCardDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SmsHelpCardDialog({ open, onClose }: SmsHelpCardDialogProps) {
  const { data: helpCard, isPending, isError } = useSmsHelpCardQuery();

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-2xl print:border-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 print:hidden">
          <h2 className="text-card-title font-semibold text-ink">Printable SMS Help Card</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-body text-ink print:p-0">
          {isPending && <p className="text-ink-muted">Loading SMS help card…</p>}
          {isError && <p className="text-negative">Could not load SMS help card details.</p>}

          {helpCard && (
            <div className="flex flex-col gap-5 rounded-lg border-2 border-line-strong p-6 print:border-2">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded bg-primary text-secondary font-bold">
                    W
                  </div>
                  <span className="text-card-title font-semibold text-ink">WildX Community SMS</span>
                </div>
                <div className="text-right">
                  <span className="text-caption text-ink-muted">Short Code</span>
                  <div className="text-form-title font-bold text-primary">{helpCard.shortCode}</div>
                </div>
              </div>

              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
                  Message Format
                </span>
                <div className="mt-1 rounded-md bg-surface-sunken p-3 font-mono text-body font-semibold text-ink">
                  {helpCard.format}
                </div>
                <p className="mt-1.5 text-caption text-ink-muted">
                  Example: <span className="font-semibold text-ink font-mono">{helpCard.example}</span>
                </p>
              </div>

              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
                  Keywords by Language
                </span>
                <div className="mt-1.5 overflow-hidden rounded-md border border-line">
                  <table className="w-full text-left text-caption">
                    <thead className="bg-surface-muted font-semibold text-ink">
                      <tr>
                        <th className="px-3 py-2">Report Type</th>
                        <th className="px-3 py-2">English</th>
                        <th className="px-3 py-2">සිංහල</th>
                        <th className="px-3 py-2">தமிழ்</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {helpCard.keywords.map((kw) => (
                        <tr key={kw.type}>
                          <td className="px-3 py-2 font-medium text-ink">{kw.label}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary">{kw.english}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary">{kw.sinhala}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary">{kw.tamil}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
                  Landmark Codes ({helpCard.parkName} Park)
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-caption">
                  {helpCard.landmarks.map((lm) => (
                    <div key={lm.id} className="flex items-center justify-between rounded border border-line bg-surface p-2">
                      <span className="text-ink-body font-medium">{lm.name}</span>
                      <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono font-bold text-primary">
                        {lm.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-surface-muted px-5 py-3.5 print:hidden">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            <span>Print help card</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
