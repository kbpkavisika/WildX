import { ROLES, type Role } from "@/lib/enums";

export const LOGIN_PATH = "/login";

export function homePath(role: Role): string {
  return role === ROLES.RANGER ? "/ranger" : "/dashboard";
}

export function canUseDashboard(role: Role): boolean {
  return role !== ROLES.RANGER;
}

export function canUseRangerApp(role: Role): boolean {
  return role === ROLES.RANGER;
}

const REPORT_ROLES = new Set<Role>([ROLES.MANAGER, ROLES.RESEARCHER]);

export function canViewIncidents(role: Role | undefined): boolean {
  return role === ROLES.MANAGER;
}

export function canViewReports(role: Role | null | undefined): boolean {
  return role != null && REPORT_ROLES.has(role);
}
