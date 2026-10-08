import { Bell, ChartColumn, House, MessageSquare, Radio, Route, Settings, TriangleAlert, type LucideIcon } from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  count: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: House },
  {
    label: "Patrols",
    href: "/dashboard/patrols",
    icon: Route,
    children: [
      { label: "Active patrols", href: "/dashboard/patrols/active", count: 4 },
      { label: "All patrols", href: "/dashboard/patrols", count: 9 },
    ],
  },
  { label: "Incidents", href: "/dashboard/incidents", icon: TriangleAlert },
  {
    label: "Sensors",
    href: "/dashboard/devices",
    icon: Radio,
    children: [
      { label: "Collars", href: "/dashboard/devices", count: 12 },
      { label: "Camera traps", href: "/dashboard/images", count: 31 },
    ],
  },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell, badge: 3 },
  { label: "Community reports", href: "/dashboard/community", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/reports", icon: ChartColumn },
  {
    label: "Settings",
    href: "/dashboard/settings/incident-types",
    icon: Settings,
    children: [
      { label: "Incident types", href: "/dashboard/settings/incident-types", count: 5 },
      { label: "Boundary segments", href: "/dashboard/settings/boundary-segments", count: 3 },
    ],
  },
];
