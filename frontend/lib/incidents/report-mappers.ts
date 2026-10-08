import type { IncidentReportCount, IncidentReportPoint, IncidentReportResponse } from "@/lib/api/incident-report";
import { formatMonth, toIsoDate } from "@/lib/format";
import type { LatLng } from "@/lib/patrols/types";

const NO_SECTOR = "Outside sectors";
const FULL_PCT = 100;
const MONTHS_SHOWN = 6;

export interface CountBar {
  key: string;
  label: string;
  count: number;
  widthPct: number;
  highlighted: boolean;
}

export interface ReportPoint {
  id: number;
  position: LatLng;
  label: string;
}

export interface IncidentReportView {
  total: number;
  byType: CountBar[];
  bySector: CountBar[];
  byMonth: CountBar[];
  points: ReportPoint[];
}

function monthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return `${formatMonth(new Date(year, month - 1))} ${year}`;
}

function toBars(counts: IncidentReportCount[], label: (count: IncidentReportCount) => string): CountBar[] {
  const max = Math.max(0, ...counts.map((count) => count.count));
  const topIndex = max === 0 ? -1 : counts.findIndex((count) => count.count === max);
  return counts.map((count, index) => ({
    key: `${count.id ?? count.name ?? "none"}-${index}`,
    label: label(count),
    count: count.count,
    widthPct: max === 0 ? 0 : (count.count / max) * FULL_PCT,
    highlighted: index === topIndex,
  }));
}

function toReportPoint(point: IncidentReportPoint): ReportPoint[] {
  if (point.lat === null || point.lng === null) return [];
  return [{ id: point.id, position: [point.lat, point.lng], label: `${point.typeName} · INC-${point.id}` }];
}

export function toIncidentReportView(report: IncidentReportResponse): IncidentReportView {
  return {
    total: report.total,
    byType: toBars(report.byType, (count) => count.name ?? ""),
    bySector: toBars(report.bySector, (count) => count.name ?? NO_SECTOR),
    byMonth: toBars(report.byMonth, (count) => monthLabel(count.name ?? "")),
    points: report.points.flatMap(toReportPoint),
  };
}

export function defaultReportRange(today: Date): { from: string; to: string } {
  const start = new Date(today.getFullYear(), today.getMonth() - (MONTHS_SHOWN - 1), 1);
  return { from: toIsoDate(start), to: toIsoDate(today) };
}

export function reportRangeError(from: string, to: string): string | null {
  if (from === "" || to === "") return "Choose both dates";
  return from > to ? "Start date must be before the end date" : null;
}
