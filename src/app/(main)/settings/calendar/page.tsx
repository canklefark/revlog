import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { listUserCalendars } from "@/lib/services/calendar-sync";
import { CalendarSettingsForm } from "./calendar-settings-form";
import { BackLink } from "@/components/shared/back-link";

export default async function CalendarSettingsPage() {
  const userId = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      calendarSyncEnabled: true,
      calendarId: true,
      calendarProvider: true,
    },
  });

  const googleAccount = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true },
  });

  const isGoogleConnected = googleAccount !== null;
  const hasGoogleCreds = Boolean(process.env.GOOGLE_CLIENT_ID);

  // Fetch the user's calendar list server-side (no API key exposed to client).
  const calendars = isGoogleConnected ? await listUserCalendars(userId) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/settings" label="Settings" />
      <h1 className="mb-2 text-2xl font-bold">Calendar Sync</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Connect Google Calendar to automatically sync events when you register.
      </p>

      <CalendarSettingsForm
        hasGoogleCreds={hasGoogleCreds}
        isGoogleConnected={isGoogleConnected}
        calendars={calendars.map((c) => ({ id: c.id, summary: c.summary }))}
        currentSettings={{
          calendarSyncEnabled: user?.calendarSyncEnabled ?? false,
          calendarId: user?.calendarId ?? null,
          calendarProvider: user?.calendarProvider ?? null,
        }}
      />
    </div>
  );
}
