import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/events/calendar-view";
import Link from "next/link";

export default async function EventsCalendarPage() {
  const userId = await requireAuth();
  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
      registrationStatus: true,
    },
  });

  return (
    <main className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/events"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">Calendar</span>
          </div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
        </div>
        <Link
          href="/events"
          className="text-xs text-primary hover:underline underline-offset-4"
        >
          List view →
        </Link>
      </div>
      <CalendarView
        events={events.map((e) => ({
          ...e,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
