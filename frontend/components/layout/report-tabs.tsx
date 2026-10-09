"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/utils";
import { REPORT_TABS } from "./report-tab-items";

export function ReportTabs() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  return (
    <nav aria-label="Reports" className="flex flex-wrap gap-2">
      {REPORT_TABS.filter((tab) => can(role, tab.permission)).map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-sm border px-3 text-field-label font-normal",
              active ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-body hover:bg-surface-muted",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
