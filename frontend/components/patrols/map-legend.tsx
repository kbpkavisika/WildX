export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-82px)] flex-wrap items-center gap-3.5 rounded-md border border-line bg-card px-3 py-2 text-caption text-ink-body">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border-2 border-white bg-track-1 shadow-[0_0_0_1px_var(--line-strong)]" />
        Team position
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-4 rounded-[2px] border-t-[3px] border-track-1" />
        Track
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" className="fill-negative">
          <path d="M12 3L22 21H2Z" />
        </svg>
        Incident
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-4 border-t-[1.5px] border-dashed border-primary" />
        Park boundary
      </span>
    </div>
  );
}
