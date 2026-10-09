import type { CoverageReportRowResponse, SectorCoverageResponse } from "@/lib/api/patrols";
import { counted } from "@/lib/devices/mappers";
import { formatDate, formatDayTime } from "@/lib/format";
import { toBars, type CountBar } from "@/lib/incidents/report-mappers";
import { topOf, toShares } from "@/lib/reports/mappers";
import type { Highlight, NamedCount } from "@/lib/reports/types";
import { toSectorShape } from "./mappers";
import type { CoverageLevel, CoverageReportView, CoverageSectorView, CoverageView } from "./types";

const NO_VALUE = "—";
export const NO_PATROLS = "No patrols recorded in this range.";

function ageLabel(days: number | null): string {
  if (days === null) return "Never";
  return days === 0 ? "Today" : counted(days, "day", "days");
}

function toCoverageSector(sector: SectorCoverageResponse): CoverageSectorView {
  const shape = toSectorShape({ id: sector.sectorId, name: sector.sectorName, polygonGeojson: sector.polygonGeojson });
  return {
    id: sector.sectorId,
    name: sector.sectorName,
    rings: shape?.rings ?? [],
    neglected: sector.neglected,
    caption: sector.lastPatrolledAt ? `Last patrolled ${formatDate(new Date(sector.lastPatrolledAt))}` : "Never patrolled",
    status: { tone: sector.neglected ? "negative" : "positive", label: ageLabel(sector.daysSinceLastPatrol) },
  };
}

export function toCoverageView(sectors: SectorCoverageResponse[]): CoverageView {
  const views = sectors.map(toCoverageSector);
  return {
    sectors: [...views.filter((sector) => sector.neglected), ...views.filter((sector) => !sector.neglected)],
    neglectedCount: views.filter((sector) => sector.neglected).length,
  };
}

export function coverageLevel(points: number, patrols: number, maxPoints: number): CoverageLevel {
  if (patrols === 0) return "none";
  const share = maxPoints === 0 ? 0 : points / maxPoints;
  if (share > 2 / 3) return "high";
  return share > 1 / 3 ? "medium" : "low";
}

function sectorCounts(rows: CoverageReportRowResponse[], count: (row: CoverageReportRowResponse) => number): NamedCount[] {
  return rows.map((row) => ({ key: String(row.sectorId), label: row.sectorName, count: count(row) }));
}

function sectorBars(rows: CoverageReportRowResponse[]): CountBar[] {
  const counts = sectorCounts(rows, (row) => row.patrolCount)
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ id: Number(item.key), name: item.label, count: item.count }));
  return toBars(counts, (item) => item.name ?? "");
}

function coverageHighlights(rows: CoverageReportRowResponse[], visitedCount: number): Highlight[] {
  const coveredPct = rows.length === 0 ? 0 : Math.round((visitedCount / rows.length) * 100);
  const busiest = topOf(sectorCounts(rows, (row) => row.pointCount));
  const unvisited = rows.filter((row) => row.patrolCount === 0);
  return [
    { title: "Sectors covered", value: `${coveredPct}%`, caption: `${visitedCount} of ${counted(rows.length, "sector", "sectors")}`, icon: "total" },
    {
      title: "Busiest sector",
      value: busiest?.label ?? NO_VALUE,
      caption: busiest ? counted(busiest.count, "track point", "track points") : NO_PATROLS,
      icon: "top",
    },
    {
      title: "Not visited",
      value: counted(unvisited.length, "sector", "sectors"),
      caption: unvisited[0]?.sectorName ?? "Every sector visited",
      icon: "warning",
    },
  ];
}

export function toCoverageReportView(rows: CoverageReportRowResponse[], now: Date): CoverageReportView {
  const maxPoints = Math.max(0, ...rows.map((row) => row.pointCount));
  const visitedCount = rows.filter((row) => row.patrolCount > 0).length;
  return {
    rows: rows.map((row) => ({
      id: row.sectorId,
      sector: row.sectorName,
      points: row.pointCount,
      patrols: row.patrolCount,
      unvisited: row.patrolCount === 0,
      lastVisit: row.lastPatrolledAt ? formatDayTime(new Date(row.lastPatrolledAt), now) : NO_VALUE,
      level: coverageLevel(row.pointCount, row.patrolCount, maxPoints),
      tooltip: `${row.sectorName} · ${counted(row.pointCount, "point", "points")} · ${counted(row.patrolCount, "patrol", "patrols")}`,
    })),
    visitedCount,
    sectorCount: rows.length,
    highlights: coverageHighlights(rows, visitedCount),
    byPatrols: sectorBars(rows),
    pointShares: toShares(sectorCounts(rows, (row) => row.pointCount)),
  };
}
