"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface AppHeaderProps {
  user: {
    name: string | null;
    image: string | null;
    email: string | null;
  } | null;
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/events") return "Events";
  if (pathname === "/events/new") return "New Event";
  if (pathname.startsWith("/events/") && pathname.endsWith("/edit"))
    return "Edit Event";
  if (pathname.startsWith("/events/")) return "Event Details";
  if (pathname === "/garage") return "Garage";
  if (pathname === "/garage/new") return "New Car";
  if (pathname.startsWith("/garage/") && pathname.endsWith("/edit"))
    return "Edit Car";
  if (pathname.includes("/maintenance/new")) return "New Maintenance Entry";
  if (pathname.includes("/maintenance/") && pathname.endsWith("/edit"))
    return "Edit Maintenance";
  if (pathname.includes("/maintenance")) return "Maintenance Log";
  if (pathname.startsWith("/garage/")) return "Car Details";
  if (pathname === "/times") return "Times";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/settings/")) return "Settings";
  return "";
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-lg font-bold tracking-tight text-foreground">
          RevLog
        </span>
      </div>
      <div className="hidden md:flex items-center">
        {pageTitle && (
          <h1 className="text-base font-semibold text-foreground">
            {pageTitle}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
