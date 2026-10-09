export const SCHEDULE_KINDS = { PATROL: "PATROL", MAINTENANCE: "MAINTENANCE" } as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[keyof typeof SCHEDULE_KINDS];

export type ChipTone = "positive" | "negative" | "neutral" | "done";

export interface DashboardResponse {
  metrics: {
    activeAlerts: number;
    alertsToday: number;
    collarsReporting: number;
    collarsTotal: number;
    patrolsActive: number;
    patrolsOnSchedule: boolean;
    imagesToReview: number;
    imagesChangeToday: number;
  };
  conflict: {
    monthly: { month: string; count: number }[];
    changeVsLastSeasonPct: number;
  };
  schedule: {
    id: string;
    kind: ScheduleKind;
    title: string;
    area: string;
    start: string;
    end: string;
    owner: string;
  }[];
}

export interface Metric {
  label: string;
  value: number;
  total?: number;
  emphasis?: boolean;
  chip: { tone: ChipTone; text: string };
}

export interface ChartBar {
  label: string;
  value: number;
  heightPct: number;
  highlighted: boolean;
}

export interface ConflictChart {
  total: number;
  period: string;
  bars: ChartBar[];
  average: number;
  averagePct: number;
  changePct: number;
  improving: boolean;
}

export interface ScheduleItem {
  id: string;
  kind: ScheduleKind;
  title: string;
  meta: string;
}

export interface ScheduleGroup {
  label: string;
  items: ScheduleItem[];
}

export interface WeekDay {
  weekday: string;
  day: number;
  isToday: boolean;
}

export interface DashboardView {
  greeting: string;
  today: string;
  metrics: Metric[];
  conflict: ConflictChart;
  schedule: ScheduleGroup[];
}
