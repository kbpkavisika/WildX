"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, Route, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RangerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const RANGER_NAV_ITEMS: RangerNavItem[] = [
  { label: "Patrols", href: "/ranger", icon: Route },
  { label: "Report", href: "/ranger/incident/new", icon: TriangleAlert },
  { label: "Tasks", href: "/ranger/tasks", icon: ClipboardList },
  { label: "Alerts", href: "/ranger/alerts", icon: Bell },
];

export function RangerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Ranger" className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-card">
      {RANGER_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "m-1.5 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-caption text-ink-body",
              active && "bg-lime font-medium text-ink",
            )}
          >
            <Icon className="size-5" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
