"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/store";
import { canUseDashboard, LOGIN_PATH } from "@/lib/auth/routes";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const current = useAuthStore.getState().user;
    if (current === null || !canUseDashboard(current.role)) router.replace(LOGIN_PATH);
  }, [user, router]);

  return children;
}
