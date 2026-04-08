import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { User, Palette, CalendarSync, Gauge, Database } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settingsSections = [
  {
    href: "/settings/profile",
    Icon: User,
    title: "Profile",
    description: "Name, home address, timezone, units, and season budget.",
  },
  {
    href: "/settings/appearance",
    Icon: Palette,
    title: "Appearance",
    description: "Choose between light and dark mode.",
  },
  {
    href: "/settings/calendar",
    Icon: CalendarSync,
    title: "Calendar Sync",
    description: "Connect Google Calendar to sync your registered events.",
  },
  {
    href: "/settings/penalties",
    Icon: Gauge,
    title: "Penalty Defaults",
    description: "Configure default penalty seconds per cone by event type.",
  },
  {
    href: "/settings/data",
    Icon: Database,
    title: "Data Management",
    description: "Export your data or permanently delete your account.",
  },
] as const;

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <div className="flex flex-col gap-3">
        {settingsSections.map(({ href, Icon, title, description }) => (
          <Link key={href} href={href} className="block">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 py-4">
                <div className="rounded-md bg-muted p-2">
                  <Icon
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-sm">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
