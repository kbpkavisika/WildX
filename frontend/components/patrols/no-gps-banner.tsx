import { LocateOff } from "lucide-react";

export function NoGpsBanner() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-negative-line bg-negative-bg px-4 py-3 text-negative">
      <LocateOff className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} />
      <span className="flex flex-col gap-0.5">
        <span className="text-label">No GPS. Your patrol is still running.</span>
        <span className="text-caption text-ink-muted">Tracking resumes when the signal returns.</span>
      </span>
    </div>
  );
}
