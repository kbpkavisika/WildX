import type { Permission } from "@/lib/auth/permissions";

export const REPORT_TABS: { label: string; href: string; permission: Permission }[] = [
  { label: "Incidents", href: "/dashboard/reports/incidents", permission: "report.incidents" },
  { label: "Conflicts", href: "/dashboard/reports/conflicts", permission: "report.conflicts" },
  { label: "Coverage", href: "/dashboard/reports/coverage", permission: "report.coverage" },
  { label: "Alerts", href: "/dashboard/reports/alerts", permission: "report.alerts" },
];
