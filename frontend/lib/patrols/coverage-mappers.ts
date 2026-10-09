import type { CoverageReportRowResponse, SectorCoverageResponse } from "@/lib/api/patrols";
import { counted } from "@/lib/devices/mappers";
import { formatDate, formatDayTime } from "@/lib/format";
import { toSectorShape } from "./mappers";
import type { CoverageReportView, CoverageSectorView, CoverageView } from "./types";

const NO_VALUE = "—";

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

export function toCoverageReportView(rows: CoverageReportRowResponse[], now: Date): CoverageReportView {
  return {
    rows: rows.map((row) => ({
      id: row.sectorId,
      sector: row.sectorName,
      points: row.pointCount,
      patrols: row.patrolCount,
      unvisited: row.patrolCount === 0,
      lastVisit: row.lastPatrolledAt ? formatDayTime(new Date(row.lastPatrolledAt), now) : NO_VALUE,
    })),
    visitedCount: rows.filter((row) => row.patrolCount > 0).length,
    sectorCount: rows.length,
  };
}
