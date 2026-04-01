"use client";

import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface AppHeaderProps {
  user: {
    name: string | null;
    image: string | null;
    email: string | null;
  } | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-lg font-bold tracking-tight text-foreground">
          RevLog
        </span>
      </div>
      <div className="hidden md:flex" />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
