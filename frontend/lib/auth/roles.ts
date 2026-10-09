import { ROLES, type Role } from "@/lib/enums";

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.RANGER]: "Ranger",
  [ROLES.SUPERVISOR]: "Supervisor",
  [ROLES.MANAGER]: "Park manager",
  [ROLES.CLO]: "Community liaison officer",
  [ROLES.LEL]: "Law enforcement liaison",
  [ROLES.ADMIN]: "Admin",
};
