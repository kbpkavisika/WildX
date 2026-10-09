import { BAR_MAX_HEIGHT_PCT, DAYS_IN_WEEK } from "@/lib/constants";
import { formatDate, formatDayLabel, formatMonth, formatTime, formatWeekday, isSameDay } from "@/lib/format";
import type { ConflictChart, DashboardResponse, DashboardView, Metric, ScheduleGroup, WeekDay } from "./types";

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 17;

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < MORNING_END_HOUR) return "Good morning,";
  if (hour < AFTERNOON_END_HOUR) return "Good afternoon,";
  return "Good evening,";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

export function toMetrics(m: DashboardResponse["metrics"]): Metric[] {
  const offline = m.collarsTotal - m.collarsReporting;
  return [
    {
      label: "Active alerts",
      value: m.activeAlerts,
      chip: { tone: m.alertsToday > 0 ? "negative" : "positive", text: `${signed(m.alertsToday)} today` },
    },
    {
      label: "Collars reporting",
      value: m.collarsReporting,
      total: m.collarsTotal,
      chip: offline > 0 ? { tone: "negative", text: `${offline} offline` } : { tone: "positive", text: "All online" },
    },
    {
      label: "Patrols active",
      value: m.patrolsActive,
      chip: m.patrolsOnSchedule ? { tone: "positive", text: "On schedule" } : { tone: "negative", text: "Overdue" },
    },
    {
      label: "Images to review",
      value: m.imagesToReview,
      emphasis: true,
      chip: { tone: m.imagesChangeToday <= 0 ? "positive" : "negative", text: `${signed(m.imagesChangeToday)} today` },
    },
  ];
}

export function toConflictChart(c: DashboardResponse["conflict"]): ConflictChart {
  const counts = c.monthly.map((m) => m.count);
  const max = Math.max(...counts);
  const total = counts.reduce((sum, n) => sum + n, 0);
  const average = Math.round(total / counts.length);
  const scale = (value: number) => (value / max) * BAR_MAX_HEIGHT_PCT;
  const months = c.monthly.map((m) => {
    const [year, month] = m.month.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const first = months[0];
  const last = months[months.length - 1];
  return {
    total,
    period: `${formatMonth(first)} – ${formatMonth(last)}, ${last.getFullYear()}`,
    bars: c.monthly.map((m, i) => ({
      label: formatMonth(months[i]),
      value: m.count,
      heightPct: scale(m.count),
      highlighted: i === counts.indexOf(max),
    })),
    average,
    averagePct: scale(average),
    changePct: Math.abs(c.changeVsLastSeasonPct),
    improving: c.changeVsLastSeasonPct <= 0,
  };
}

export function toScheduleGroups(items: DashboardResponse["schedule"], now: Date): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  for (const item of items) {
    const start = new Date(item.start);
    const label = isSameDay(start, now) ? "Today" : formatDayLabel(start);
    const group = groups.get(label) ?? { label, items: [] };
    group.items.push({
      id: item.id,
      kind: item.kind,
      title: `${item.title} · ${item.area}`,
      meta: `${formatTime(start)} – ${formatTime(new Date(item.end))} · ${item.owner}`,
    });
    groups.set(label, group);
  }
  return [...groups.values()];
}

export function weekOf(date: Date, today: Date): WeekDay[] {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK));
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return { weekday: formatWeekday(day), day: day.getDate(), isToday: isSameDay(day, today) };
  });
}

export function toDashboardView(data: DashboardResponse, now: Date): DashboardView {
  return {
    greeting: greetingFor(now),
    today: formatDate(now),
    metrics: toMetrics(data.metrics),
    conflict: toConflictChart(data.conflict),
    schedule: toScheduleGroups(data.schedule, now),
  };
}
