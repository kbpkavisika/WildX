import { Bell, ChartColumn, House, MessageSquare, Radio, Route, Settings, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export interface NavChild {
  label: string;
  href: string;
  permission?: Permission;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  alertBadge?: boolean;
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
      { label: "Active patrols", href: "/dashboard/patrols/active" },
      { label: "All patrols", href: "/dashboard/patrols" },
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
      { label: "Collars", href: "/dashboard/devices" },
      { label: "Camera traps", href: "/dashboard/images", permission: "nav.images" },
    ],
  },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell, alertBadge: true, permission: "nav.alerts" },
  { label: "Community reports", href: "/dashboard/community", icon: MessageSquare, permission: "nav.community" },
  { label: "Analytics", href: "/dashboard/reports", icon: ChartColumn, permission: "nav.reports" },
  {
    label: "Settings",
    href: "/dashboard/settings/incident-types",
    icon: Settings,
    permission: "nav.settings",
    children: [
      { label: "Parks", href: "/dashboard/settings/parks", permission: "settings.manage" },
      { label: "Sectors", href: "/dashboard/settings/sectors" },
      { label: "Incident types", href: "/dashboard/settings/incident-types" },
      { label: "Boundary segments", href: "/dashboard/settings/boundary-segments" },
      { label: "Zones and rules", href: "/dashboard/settings/zones" },
    ],
  },
  { label: "Users", href: "/dashboard/users", icon: Users, permission: "nav.users" },
];
