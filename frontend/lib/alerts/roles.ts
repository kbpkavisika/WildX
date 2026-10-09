import { canViewReports } from "@/lib/auth/routes";
import type { Role } from "@/lib/enums";

export function canViewAlertReport(role: Role | null): boolean {
  return canViewReports(role);
}
