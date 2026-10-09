import { ROLES, type Role } from "@/lib/enums";

const { ADMIN, MANAGER, CLO, RESEARCHER, RANGER } = ROLES;

export const PERMISSIONS = {
  "nav.dashboard": [ADMIN, MANAGER, CLO, RESEARCHER],
  "nav.patrols": [MANAGER],
  "nav.incidents": [MANAGER],
  "nav.devices": [ADMIN, MANAGER, CLO],
  "nav.images": [ADMIN, MANAGER],
  "nav.alerts": [MANAGER, CLO],
  "nav.community": [ADMIN, MANAGER, CLO],
  "nav.reports": [ADMIN, MANAGER, CLO, RESEARCHER],
  "nav.settings": [ADMIN, MANAGER, CLO],
  "nav.users": [ADMIN],
  "nav.simulator": [ADMIN, MANAGER],
  "report.incidents": [MANAGER, RESEARCHER],
  "report.coverage": [MANAGER, RESEARCHER],
  "report.alerts": [MANAGER, RESEARCHER],
  "report.conflicts": [ADMIN, MANAGER, CLO, RESEARCHER],
  "patrol.create": [MANAGER],
  "route.create": [MANAGER],
  "device.manage": [ADMIN, MANAGER],
  "image.view": [ADMIN, MANAGER],
  "image.tag": [MANAGER],
  "alert.handle": [MANAGER, RANGER],
  "alert.dispatch": [MANAGER],
  "incident.report": [RANGER],
  "community.act": [MANAGER, CLO],
  "dispatch.create": [ADMIN, MANAGER, CLO],
  "settings.manage": [MANAGER],
  "boundary.manage": [MANAGER],
  "simulator.use": [ADMIN, MANAGER],
  "user.manage": [ADMIN],
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
