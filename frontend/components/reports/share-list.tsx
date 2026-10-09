import { Card, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { ShareRow } from "@/lib/reports/types";

export function ShareList({ title, rows, empty }: { title: string; rows: ShareRow[]; empty: string }) {
  return (
    <Card label={title}>
      <CardTitle>{title}</CardTitle>
      {rows.length === 0 && <p className="m-0 text-body text-ink-muted">{empty}</p>}
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3">
            <InitialsAvatar initials={row.initials} />
            <span className="flex min-w-0 grow flex-col gap-1.5">
              <span className="truncate text-label text-ink">{row.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <span style={{ width: `${row.pct}%` }} className="block h-full rounded-full bg-ink" />
              </span>
            </span>
            <span className="w-[72px] shrink-0 text-right text-metric text-ink">{row.pct}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
