import { formatDate, formatMonth, formatMonthYear, fromIsoDate, initialsOf, toIsoDate } from "@/lib/format";
import type { DayCount, NamedCount, ShareRow, TrendBar, TrendUnit, TrendView } from "./types";

const FULL_PCT = 100;
const BAR_HEADROOM = 0.72;
const AXIS_LABELS = 6;
const SHARE_ROWS = 5;
const MINUS = "−";

interface Bucket {
  start: Date;
  count: number;
}

function bucketStart(date: Date, unit: TrendUnit): Date {
  if (unit === "month") return new Date(date.getFullYear(), date.getMonth(), 1);
  if (unit === "week") return new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function toBuckets(days: DayCount[], unit: TrendUnit): Bucket[] {
  const buckets = new Map<string, Bucket>();
  for (const day of days) {
    const start = bucketStart(fromIsoDate(day.date), unit);
    const key = toIsoDate(start);
    const bucket = buckets.get(key) ?? { start, count: 0 };
    bucket.count += day.count;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

function shortLabel(start: Date, unit: TrendUnit): string {
  return unit === "month" ? formatMonth(start) : `${start.getDate()} ${formatMonth(start)}`;
}

function longLabel(start: Date, unit: TrendUnit): string {
  if (unit === "month") return formatMonthYear(start);
  return unit === "week" ? `Week of ${shortLabel(start, unit)}` : formatDate(start);
}

function movingAverage(counts: number[], index: number): number {
  const window = counts.slice(Math.max(0, index - 1), index + 2);
  return window.reduce((sum, count) => sum + count, 0) / window.length;
}

export function trendChange(counts: number[]): string | null {
  if (counts.length < 2) return null;
  const [previous, last] = counts.slice(-2);
  if (previous === 0) return last === 0 ? "0%" : "New";
  const pct = Math.round(((last - previous) / previous) * FULL_PCT);
  return pct < 0 ? `${MINUS}${Math.abs(pct)}%` : `+${pct}%`;
}

function axisFor(buckets: Bucket[], unit: TrendUnit): TrendView["axis"] {
  const step = Math.max(1, Math.ceil(buckets.length / AXIS_LABELS));
  return buckets.flatMap((bucket, index) => (index % step === 0 ? [{ index, label: shortLabel(bucket.start, unit) }] : []));
}

export function toTrendView(days: DayCount[], unit: TrendUnit): TrendView {
  const buckets = toBuckets(days, unit);
  const counts = buckets.map((bucket) => bucket.count);
  const scale = Math.max(1, ...counts) / BAR_HEADROOM;
  const bars: TrendBar[] = buckets.map((bucket, index) => ({
    key: toIsoDate(bucket.start),
    label: shortLabel(bucket.start, unit),
    tooltip: `${longLabel(bucket.start, unit)} · ${bucket.count}`,
    heightPct: (bucket.count / scale) * FULL_PCT,
    averagePct: (movingAverage(counts, index) / scale) * FULL_PCT,
  }));
  return {
    bars,
    axis: axisFor(buckets, unit),
    total: counts.reduce((sum, count) => sum + count, 0),
    change: trendChange(counts),
    changeCaption: `vs previous ${unit}`,
  };
}

export function toShares(items: NamedCount[]): ShareRow[] {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return [];
  return [...items]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, SHARE_ROWS)
    .map((item) => ({ key: item.key, label: item.label, initials: initialsOf(item.label), pct: Math.round((item.count / total) * FULL_PCT) }));
}

export function topOf(items: NamedCount[]): NamedCount | null {
  return items.reduce<NamedCount | null>((top, item) => (item.count > 0 && (top === null || item.count > top.count) ? item : top), null);
}
