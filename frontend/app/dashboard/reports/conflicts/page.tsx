"use client";

import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/field";
import { fetchConflictTrends, fetchConflictTrendsCsv, type ConflictTrend } from "@/lib/api/community";
import { downloadBlob } from "@/lib/files";
import { toIsoDate } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api/client";

function defaultDates() {
  const now = new Date();
  const past = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: toIsoDate(past),
    to: toIsoDate(now),
  };
}

export default function ConflictReportsPage() {
  const [dates, setDates] = useState(defaultDates);

  const query = useQuery({
    queryKey: ["reports", "conflicts", dates.from, dates.to],
    queryFn: () => fetchConflictTrends(dates.from, dates.to),
    enabled: Boolean(dates.from && dates.to && dates.from <= dates.to),
  });

  const csv = useMutation({
    mutationFn: () => fetchConflictTrendsCsv(dates.from, dates.to),
    onSuccess: (blob) => downloadBlob(blob, `conflicts-${dates.from}-${dates.to}.csv`),
  });

  const rangeInvalid = dates.from > dates.to;

  const data: ConflictTrend[] = query.data ?? [];
  const totalConflicts = data.reduce((sum, item) => sum + item.conflictCount, 0);

  const bySegment = data.reduce<Record<string, { code: string; count: number }>>((acc, item) => {
    if (!acc[item.segmentName]) {
      acc[item.segmentName] = { code: item.segmentCode, count: 0 };
    }
    acc[item.segmentName].count += item.conflictCount;
    return acc;
  }, {});

  const byMonth = data.reduce<Record<string, number>>((acc, item) => {
    acc[item.month] = (acc[item.month] || 0) + item.conflictCount;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Conflict trend report"
        subtitle={
          <>
            <strong className="font-semibold text-ink">{totalConflicts} conflict events</strong> recorded in this
            range across boundary segments.
          </>
        }
        action={
          <Button
            onClick={() => csv.mutate()}
            disabled={rangeInvalid || csv.isPending}
            className="gap-2 disabled:opacity-60"
          >
            <Download className="size-4" strokeWidth={2} />
            <span>{csv.isPending ? "Preparing CSV…" : "Download CSV"}</span>
          </Button>
        }
      />

      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <Field label="From">
          <input
            type="date"
            value={dates.from}
            max={dates.to}
            onChange={(e) => setDates((prev) => ({ ...prev, from: e.target.value }))}
            className={fieldClass(rangeInvalid)}
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={dates.to}
            min={dates.from}
            onChange={(e) => setDates((prev) => ({ ...prev, to: e.target.value }))}
            className={fieldClass(rangeInvalid)}
          />
        </Field>
      </div>

      {rangeInvalid && <p className="text-caption text-negative">The start date must be before the end date.</p>}
      {csv.isError && <p className="text-body text-negative">{apiErrorMessage(csv.error)}</p>}
      {query.isPending && <p className="text-body text-ink-muted">Loading conflict report…</p>}
      {query.isError && <p className="text-body text-negative">Could not load the conflict report.</p>}

      {query.data && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card label="Conflicts by month">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <TrendingUp className="size-4 text-primary" />
                <CardTitle>Monthly conflict frequency</CardTitle>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {Object.keys(byMonth).length === 0 && (
                  <p className="text-caption text-ink-muted">No conflicts recorded in this date range.</p>
                )}
                {Object.entries(byMonth).map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(byMonth), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={month} className="flex flex-col gap-1">
                      <div className="flex justify-between text-body">
                        <span className="font-medium text-ink">{month}</span>
                        <span className="text-ink-muted">{count} conflicts</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card label="Conflicts by boundary segment">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <CardTitle>Segment breakdown</CardTitle>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-left text-body">
                  <thead className="bg-surface-muted text-caption font-semibold uppercase text-ink-muted">
                    <tr>
                      <th className="px-3.5 py-2.5">Segment</th>
                      <th className="px-3.5 py-2.5">Code</th>
                      <th className="px-3.5 py-2.5 text-right">Conflicts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {Object.keys(bySegment).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-caption text-ink-muted">
                          No conflict data for this range.
                        </td>
                      </tr>
                    )}
                    {Object.entries(bySegment).map(([name, { code, count }]) => (
                      <tr key={name} className="hover:bg-surface-sunken/40">
                        <td className="px-3.5 py-2.5 font-medium text-ink">{name}</td>
                        <td className="px-3.5 py-2.5 font-mono text-caption text-ink-muted">{code}</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-primary">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
