"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/times", label: "Runs", exact: true },
  { href: "/times/analytics", label: "Analytics", exact: false },
];

export function TimesNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex border-b border-border w-full mb-6">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "pb-2 mr-6 text-sm font-medium border-b-2 -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
