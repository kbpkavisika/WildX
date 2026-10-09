import { Bell, ChartColumn, House, MessageSquare, Radio, Route, Settings, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export interface NavChild {
  label: string;
  href: string;
  count?: number;
  permission?: Permission;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavChild[];
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: House, permission: "nav.dashboard" },
  {
    label: "Patrols",
    href: "/dashboard/patrols",
    icon: Route,
    permission: "nav.patrols",
    children: [
      { label: "Active patrols", href: "/dashboard/patrols/active", count: 4 },
      { label: "All patrols", href: "/dashboard/patrols", count: 9 },
      { label: "Routes", href: "/dashboard/routes" },
      { label: "Coverage", href: "/dashboard/coverage" },
    ],
  },
  { label: "Incidents", href: "/dashboard/incidents", icon: TriangleAlert, permission: "nav.incidents" },
  {
    label: "Sensors",
    href: "/dashboard/devices",
    icon: Radio,
    permission: "nav.devices",
    children: [
      { label: "Collars", href: "/dashboard/devices", count: 12 },
      { label: "Camera traps", href: "/dashboard/images", count: 31, permission: "nav.images" },
    ],
  },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell, badge: 3, permission: "nav.alerts" },
  { label: "Community reports", href: "/dashboard/community", icon: MessageSquare, permission: "nav.community" },
  { label: "Analytics", href: "/dashboard/reports", icon: ChartColumn, permission: "nav.reports" },
  {
    label: "Settings",
    href: "/dashboard/settings/incident-types",
    icon: Settings,
    permission: "nav.settings",
    children: [
      { label: "Incident types", href: "/dashboard/settings/incident-types", count: 5 },
      { label: "Boundary segments", href: "/dashboard/settings/boundary-segments", count: 3 },
      { label: "Zones and rules", href: "/dashboard/settings/zones", count: 2 },
    ],
  },
  { label: "Users", href: "/dashboard/users", icon: Users, permission: "nav.users" },
];
