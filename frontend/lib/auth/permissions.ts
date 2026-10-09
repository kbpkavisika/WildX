import { ROLES, type Role } from "@/lib/enums";

const { MANAGER, CLO, RESEARCHER, RANGER } = ROLES;

export const PERMISSIONS = {
  "nav.dashboard": [MANAGER, CLO, RESEARCHER],
  "nav.patrols": [MANAGER],
  "nav.incidents": [MANAGER],
  "nav.devices": [MANAGER, CLO],
  "nav.images": [MANAGER],
  "nav.alerts": [MANAGER, CLO],
  "nav.community": [MANAGER, CLO],
  "nav.reports": [MANAGER, CLO, RESEARCHER],
  "nav.settings": [MANAGER, CLO],
  "nav.users": [MANAGER],
  "nav.simulator": [MANAGER],
  "report.incidents": [MANAGER, RESEARCHER],
  "report.coverage": [MANAGER, RESEARCHER],
  "report.alerts": [MANAGER, RESEARCHER],
  "report.conflicts": [MANAGER, CLO, RESEARCHER],
  "patrol.create": [MANAGER],
  "route.create": [MANAGER],
  "device.manage": [MANAGER],
  "image.view": [MANAGER],
  "image.tag": [MANAGER],
  "alert.handle": [MANAGER, RANGER],
  "alert.dispatch": [MANAGER],
  "incident.report": [RANGER],
  "community.act": [MANAGER, CLO],
  "dispatch.create": [MANAGER, CLO],
  "settings.manage": [MANAGER],
  "boundary.manage": [MANAGER],
  "simulator.use": [MANAGER],
  "user.manage": [MANAGER],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return role != null && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

const PATH_PERMISSIONS: [string, Permission][] = [
  ["/dashboard/patrols", "nav.patrols"],
  ["/dashboard/routes", "nav.patrols"],
  ["/dashboard/coverage", "nav.patrols"],
  ["/dashboard/incidents", "nav.incidents"],
  ["/dashboard/devices", "nav.devices"],
  ["/dashboard/images", "nav.images"],
  ["/dashboard/alerts", "nav.alerts"],
  ["/dashboard/community", "nav.community"],
  ["/dashboard/reports/incidents", "report.incidents"],
  ["/dashboard/reports/coverage", "report.coverage"],
  ["/dashboard/reports/alerts", "report.alerts"],
  ["/dashboard/reports/conflicts", "report.conflicts"],
  ["/dashboard/reports", "nav.reports"],
  ["/dashboard/settings", "nav.settings"],
  ["/dashboard/users", "nav.users"],
  ["/dashboard/simulator", "nav.simulator"],
];

export function canVisit(role: Role, pathname: string): boolean {
  const match = PATH_PERMISSIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match === undefined || can(role, match[1]);
}
