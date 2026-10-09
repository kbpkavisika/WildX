import { ROLES, type Role } from "@/lib/enums";

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.RANGER]: "Ranger",
  [ROLES.MANAGER]: "Park manager",
  [ROLES.CLO]: "Community liaison officer",
  [ROLES.RESEARCHER]: "Researcher",
  [ROLES.ADMIN]: "Admin",
};
