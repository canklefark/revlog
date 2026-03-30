"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createEventSchema, updateEventSchema } from "@/lib/validations/event";
import { geocodeAddress } from "@/lib/services/geocode";
import { calculateDistance } from "@/lib/services/distance";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventData,
} from "@/lib/services/calendar-sync";
import { buildCalendarDescription } from "@/lib/utils/calendar";
import type { Event } from "@prisma/client";

export type EventActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Event | true;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the CalendarEventData payload from a persisted event. */
function toCalendarEventData(
  event: Event,
  eventType: string,
): CalendarEventData {
  return {
    title: `[${eventType}] ${event.name}`,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.address ?? event.venueName ?? null,
    description: buildCalendarDescription(event),
  };
}

/**
 * Geocode an address and compute driving distance from the user's home.
 * Returns partial update fields — any value may be undefined if unavailable.
 */
async function resolveDistanceFields(
  userId: string,
  address: string,
): Promise<{
  lat?: number;
  lng?: number;
  distanceFromHome?: number;
  driveTimeMinutes?: number;
}> {
  const coords = await geocodeAddress(address);
  if (!coords) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { homeLat: true, homeLng: true },
  });

  let distanceFromHome: number | undefined;
  let driveTimeMinutes: number | undefined;

  if (user?.homeLat != null && user.homeLng != null) {
    const result = await calculateDistance(
      { lat: user.homeLat, lng: user.homeLng },
      { lat: coords.lat, lng: coords.lng },
    );
    if (result) {
      distanceFromHome = result.distanceMiles;
      driveTimeMinutes = result.driveTimeMinutes;
    }
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    ...(distanceFromHome !== undefined ? { distanceFromHome } : {}),
    ...(driveTimeMinutes !== undefined ? { driveTimeMinutes } : {}),
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createEvent(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const userId = await requireAuth();

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    organizingBody: formData.get("organizingBody") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    venueName: formData.get("venueName") || undefined,
    address: formData.get("address") || undefined,
    registrationStatus: formData.get("registrationStatus") || "Interested",
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    entryFee: formData.get("entryFee") || undefined,
    registrationUrl: formData.get("registrationUrl") || undefined,
    runGroup: formData.get("runGroup") || undefined,
    notes: formData.get("notes") || undefined,
    carId: formData.get("carId") || undefined,
  };

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { startDate, endDate, registrationDeadline, ...rest } = parsed.data;

  // Resolve geocoding / distance before inserting.
  const distanceFields = rest.address
    ? await resolveDistanceFields(userId, rest.address)
    : {};

  try {
    const event = await prisma.event.create({
      data: {
        ...rest,
        userId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
        carId: rest.carId || null,
        organizingBody: rest.organizingBody || null,
        venueName: rest.venueName || null,
        address: rest.address || null,
        registrationUrl: rest.registrationUrl || null,
        runGroup: rest.runGroup || null,
        notes: rest.notes || null,
        ...distanceFields,
      },
    });

    // Sync to Google Calendar if the event is immediately Registered.
    if (event.registrationStatus === "Registered") {
      const calendarEventId = await createCalendarEvent(
        userId,
        toCalendarEventData(event, event.type),
      );
      if (calendarEventId) {
        await prisma.event.update({
          where: { id: event.id, userId },
          data: { calendarEventId },
        });
        event.calendarEventId = calendarEventId;
      }
    }

    revalidatePath("/events");
    return { data: event };
  } catch {
    return { error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const userId = await requireAuth();

  const raw = {
    eventId: formData.get("eventId"),
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    organizingBody: formData.get("organizingBody") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    venueName: formData.get("venueName") || undefined,
    address: formData.get("address") || undefined,
    registrationStatus: formData.get("registrationStatus") || undefined,
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    entryFee: formData.get("entryFee") || undefined,
    registrationUrl: formData.get("registrationUrl") || undefined,
    runGroup: formData.get("runGroup") || undefined,
    notes: formData.get("notes") || undefined,
    carId: formData.get("carId") || undefined,
  };

  const parsed = updateEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { eventId, startDate, endDate, registrationDeadline, ...rest } =
    parsed.data;

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.userId !== userId) {
    return { error: "Event not found." };
  }

  // Resolve geocoding / distance if address was changed.
  const addressChanged =
    rest.address !== undefined && rest.address !== existing.address;
  const distanceFields =
    addressChanged && rest.address
      ? await resolveDistanceFields(userId, rest.address)
      : {};

  try {
    const event = await prisma.event.update({
      where: { id: eventId, userId },
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate:
          endDate !== undefined
            ? endDate
              ? new Date(endDate)
              : null
            : undefined,
        registrationDeadline:
          registrationDeadline !== undefined
            ? registrationDeadline
              ? new Date(registrationDeadline)
              : null
            : undefined,
        carId: rest.carId !== undefined ? rest.carId || null : undefined,
        organizingBody:
          rest.organizingBody !== undefined
            ? rest.organizingBody || null
            : undefined,
        venueName:
          rest.venueName !== undefined ? rest.venueName || null : undefined,
        address: rest.address !== undefined ? rest.address || null : undefined,
        registrationUrl:
          rest.registrationUrl !== undefined
            ? rest.registrationUrl || null
            : undefined,
        runGroup:
          rest.runGroup !== undefined ? rest.runGroup || null : undefined,
        notes: rest.notes !== undefined ? rest.notes || null : undefined,
        ...distanceFields,
      },
    });

    // If the event already has a calendar entry, keep it in sync.
    if (event.calendarEventId) {
      await updateCalendarEvent(
        userId,
        event.calendarEventId,
        toCalendarEventData(event, event.type),
      );
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { data: event };
  } catch {
    return { error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const userId = await requireAuth();

  const eventId = formData.get("eventId");
  if (!eventId || typeof eventId !== "string") {
    return { error: "Event ID is required." };
  }

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.userId !== userId) {
    return { error: "Event not found." };
  }

  // Remove from Google Calendar before deleting from DB.
  if (existing.calendarEventId) {
    await deleteCalendarEvent(userId, existing.calendarEventId);
  }

  try {
    await prisma.event.delete({ where: { id: eventId, userId } });
    revalidatePath("/events");
    return { data: true };
  } catch {
    return { error: "Failed to delete event. Please try again." };
  }
}

export async function updateEventStatus(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const userId = await requireAuth();

  const eventId = formData.get("eventId");
  const status = formData.get("status");

  if (!eventId || typeof eventId !== "string") {
    return { error: "Event ID is required." };
  }
  if (!status || typeof status !== "string") {
    return { error: "Status is required." };
  }

  const validStatuses = [
    "Interested",
    "Registered",
    "Waitlisted",
    "Completed",
    "Skipped",
  ] as const;
  if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
    return { error: "Invalid status." };
  }

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.userId !== userId) {
    return { error: "Event not found." };
  }

  try {
    const event = await prisma.event.update({
      where: { id: eventId, userId },
      data: { registrationStatus: status },
    });

    // Calendar sync: create on Registered (if not yet synced), delete on Skipped.
    if (status === "Registered" && !existing.calendarEventId) {
      const calendarEventId = await createCalendarEvent(
        userId,
        toCalendarEventData(event, event.type),
      );
      if (calendarEventId) {
        await prisma.event.update({
          where: { id: event.id, userId },
          data: { calendarEventId },
        });
        event.calendarEventId = calendarEventId;
      }
    } else if (status === "Skipped" && existing.calendarEventId) {
      await deleteCalendarEvent(userId, existing.calendarEventId);
      await prisma.event.update({
        where: { id: event.id, userId },
        data: { calendarEventId: null },
      });
      event.calendarEventId = null;
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { data: event };
  } catch {
    return { error: "Failed to update status. Please try again." };
  }
}
