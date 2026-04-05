import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  type CalendarEventData,
} from "@/lib/services/calendar-sync";
import { buildCalendarDescription } from "@/lib/utils/calendar";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body: unknown = await request.json();
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { eventId } = body as Record<string, unknown>;
  if (typeof eventId !== "string") {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  }

  // Fetch the event and verify ownership.
  const [event, user] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }),
  ]);
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Only sync events that are in Registered status.
  if (event.registrationStatus !== "Registered") {
    return NextResponse.json(
      { error: "Only Registered events can be synced" },
      { status: 422 },
    );
  }

  const calendarEventData: CalendarEventData = {
    title: `[${event.type}] ${event.name}`,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    userTimezone: user?.timezone ?? "America/New_York",
    location: event.address ?? event.venueName ?? null,
    description: buildCalendarDescription(event),
  };

  const calendarEventId = await createCalendarEvent(userId, calendarEventData);

  if (!calendarEventId) {
    return NextResponse.json(
      {
        error:
          "Calendar sync failed. Ensure Google Calendar is connected and sync is enabled.",
      },
      { status: 502 },
    );
  }

  // Persist the new calendar event ID.
  await prisma.event.update({
    where: { id: eventId, userId },
    data: { calendarEventId },
  });

  return NextResponse.json({ data: { synced: true, calendarEventId } });
}
