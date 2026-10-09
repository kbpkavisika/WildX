import { ROLES, type Role } from "@/lib/enums";

const REPORT_ROLES = new Set<Role>([ROLES.MANAGER, ROLES.SUPERVISOR]);

export function canViewAlertReport(role: Role | null): boolean {
  return role !== null && REPORT_ROLES.has(role);
}
