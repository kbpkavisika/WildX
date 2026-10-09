interface MapPanelProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function MapPanel({ title, count, children }: MapPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex max-h-[calc(100%-32px)] w-[340px] max-w-[calc(100%-32px)] flex-col gap-1 overflow-y-auto rounded-[14px] border border-line bg-card px-2 py-3 shadow-float">
      <span className="flex px-3 pt-1 pb-1.5 text-field-label font-normal text-ink-muted">
        <span className="mr-auto">{title}</span>
        <span>{count}</span>
      </span>
      {children}
    </div>
  );
}
