import type { PatrolHistoryResponse, PatrolResponse } from "@/lib/api/patrols";
import { PATROL_STATUSES, type PatrolStatus } from "@/lib/enums";
import { formatDayLabel, formatDuration, formatKm, formatTime, fromIsoDate, initialsOf, isSameDay } from "@/lib/format";
import { PATROL_FILTERS, type PatrolFilter, type PatrolFilterOption, type PatrolRow, type PatrolTableView } from "./types";

const NO_VALUE = "—";

export const STATUS_DISPLAY: Record<PatrolStatus, Pick<PatrolRow, "status" | "filter">> = {
  [PATROL_STATUSES.ACTIVE]: { status: { tone: "positive", label: "Active" }, filter: PATROL_FILTERS.ACTIVE },
  [PATROL_STATUSES.PLANNED]: { status: { tone: "neutral", label: "Scheduled" }, filter: PATROL_FILTERS.SCHEDULED },
  [PATROL_STATUSES.COMPLETED]: { status: { tone: "done", label: "Completed" }, filter: PATROL_FILTERS.COMPLETED },
  [PATROL_STATUSES.CANCELLED]: { status: { tone: "neutral", label: "Cancelled" }, filter: null },
};

const FILTER_LABELS: Record<PatrolFilter, string> = {
  [PATROL_FILTERS.ALL]: "All",
  [PATROL_FILTERS.ACTIVE]: "Active",
  [PATROL_FILTERS.SCHEDULED]: "Scheduled",
  [PATROL_FILTERS.COMPLETED]: "Completed",
};

export function timeRange(patrol: PatrolResponse): string | null {
  if (!patrol.startedAt) return null;
  const start = formatTime(new Date(patrol.startedAt));
  return patrol.endedAt ? `${start} – ${formatTime(new Date(patrol.endedAt))}` : `From ${start}`;
}

export function toPatrolRow(patrol: PatrolResponse, history: PatrolHistoryResponse | undefined, now: Date): PatrolRow {
  const scheduled = fromIsoDate(patrol.scheduledDate);
  const completed = patrol.status === PATROL_STATUSES.COMPLETED;
  return {
    id: patrol.id,
    title: patrol.route.name,
    code: `PT-${patrol.id}`,
    leaderName: patrol.rangerName,
    leaderInitials: initialsOf(patrol.rangerName),
    day: isSameDay(scheduled, now) ? "Today" : formatDayLabel(scheduled),
    time: timeRange(patrol),
    distance: completed && history ? formatKm(history.distanceM) : NO_VALUE,
    duration: completed && history ? formatDuration(history.durationSeconds) : null,
    canReplay: completed,
    ...STATUS_DISPLAY[patrol.status],
  };
}

function filterOptions(rows: PatrolRow[]): PatrolFilterOption[] {
  return Object.values(PATROL_FILTERS).map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: value === PATROL_FILTERS.ALL ? rows.length : rows.filter((row) => row.filter === value).length,
  }));
}

export function toPatrolTableView(
  patrols: PatrolResponse[],
  history: PatrolHistoryResponse[],
  filter: PatrolFilter,
  now: Date,
): PatrolTableView {
  const histories = new Map(history.map((entry) => [entry.patrol.id, entry]));
  const rows = patrols.map((patrol) => toPatrolRow(patrol, histories.get(patrol.id), now));
  const filters = filterOptions(rows);
  const countOf = (value: PatrolFilter) => filters.find((option) => option.value === value)?.count ?? 0;
  return {
    rows: filter === PATROL_FILTERS.ALL ? rows : rows.filter((row) => row.filter === filter),
    filters,
    scheduledCount: countOf(PATROL_FILTERS.SCHEDULED),
    activeCount: countOf(PATROL_FILTERS.ACTIVE),
  };
}
