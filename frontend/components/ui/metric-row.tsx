interface MetricRowProps {
  metrics: { label: string; value: string }[];
}

export function MetricRow({ metrics }: MetricRowProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-t border-line">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-2.5 border-line pt-[18px] pb-1 sm:px-5 sm:first:pl-0 sm:last:pr-0 sm:not-last:border-r">
          <span className="text-body text-ink-body">{metric.label}</span>
          <span className="text-metric">{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
