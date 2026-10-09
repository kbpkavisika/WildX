"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { REPORT_TABS } from "@/components/layout/report-tab-items";
import { can } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";

export default function ReportsPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  useEffect(() => {
    const first = REPORT_TABS.find((tab) => can(role, tab.permission));
    if (first) router.replace(first.href);
  }, [role, router]);

  return null;
}
