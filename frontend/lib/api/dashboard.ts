import { SCHEDULE_KINDS, type DashboardResponse } from "@/lib/dashboard/types";

function atHour(dayOffset: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  return {
    metrics: {
      activeAlerts: 3,
      alertsToday: 1,
      collarsReporting: 12,
      collarsTotal: 13,
      patrolsActive: 4,
      patrolsOnSchedule: true,
      imagesToReview: 48,
      imagesChangeToday: -12,
    },
    conflict: {
      monthly: [
        { month: "2026-05", count: 4 },
        { month: "2026-06", count: 6 },
        { month: "2026-07", count: 11 },
        { month: "2026-08", count: 5 },
        { month: "2026-09", count: 6 },
        { month: "2026-10", count: 5 },
      ],
      changeVsLastSeasonPct: -12,
    },
    schedule: [
      { id: "p-1", kind: SCHEDULE_KINDS.PATROL, title: "Night patrol", area: "Hambegamuwa", start: atHour(0, 19), end: atHour(0, 23), owner: "K. Bandara" },
      { id: "m-1", kind: SCHEDULE_KINDS.MAINTENANCE, title: "Collar check", area: "Sudu Manika", start: atHour(1, 7), end: atHour(1, 10), owner: "Vet unit" },
    ],
  };
}
