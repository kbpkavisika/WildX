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

export function canViewIncidents(role: Role | undefined): boolean {
  return role === ROLES.SUPERVISOR || role === ROLES.MANAGER;
}
