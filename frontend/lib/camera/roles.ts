import { ROLES, type Role } from "@/lib/enums";

const VIEWER_ROLES = new Set<Role>([ROLES.MANAGER, ROLES.ADMIN]);

export function canViewCameraImages(role: Role | null): boolean {
  return role !== null && VIEWER_ROLES.has(role);
}
