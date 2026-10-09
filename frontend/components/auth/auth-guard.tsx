"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    if (current === null) router.replace(LOGIN_PATH);
    else if (!allows(current.role)) router.replace(homePath(current.role));
  }, [user, router, allows]);

  return children;
}

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allows={canUseDashboard}>{children}</RoleGuard>;
}

export function RangerGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allows={canUseRangerApp}>{children}</RoleGuard>;
}
