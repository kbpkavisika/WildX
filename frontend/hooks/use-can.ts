import { useAuthStore } from "@/lib/auth/store";
import { can, type Permission } from "@/lib/auth/permissions";

export function useCan(permission: Permission): boolean {
  return useAuthStore((state) => can(state.user?.role, permission));
}
