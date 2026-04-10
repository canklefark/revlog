import {
  LayoutDashboard,
  CalendarDays,
  Car,
  Timer,
  Settings,
  Package,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/events", label: "Events", Icon: CalendarDays },
  { href: "/garage", label: "Garage", Icon: Car },
  { href: "/parts", label: "Parts", Icon: Package },
  { href: "/times", label: "Times", Icon: Timer },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;
