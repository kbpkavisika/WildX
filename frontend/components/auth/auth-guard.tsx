"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { canVisit } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { canUseDashboard, canUseRangerApp, homePath, LOGIN_PATH } from "@/lib/auth/routes";
import type { Role } from "@/lib/enums";

interface RoleGuardProps {
  allows: (role: Role) => boolean;
  children: React.ReactNode;
}

function RoleGuard({ allows, children }: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const current = useAuthStore.getState().user;
    if (current === null || !allows(current.role)) router.replace(LOGIN_PATH);
  }, [user, router, allows]);

  return children;
}

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);

  useEffect(() => {
    if (role !== undefined && canUseDashboard(role) && !canVisit(role, pathname)) router.replace(homePath(role));
  }, [role, pathname, router]);

  return <RoleGuard allows={canUseDashboard}>{children}</RoleGuard>;
}

export function RangerGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allows={canUseRangerApp}>{children}</RoleGuard>;
}
