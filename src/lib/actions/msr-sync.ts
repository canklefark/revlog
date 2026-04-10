"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  fetchMyEvents,
  getMsrAccount,
  type MsrEventResult,
} from "@/lib/services/msr-authenticated-api";
import { msrCredsPresent } from "@/lib/services/msr-oauth";

export type MsrSyncState = {
  error?: string;
  data?: { created: number; matched: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a date-only string as noon UTC (matches event.ts convention). */
function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

/**
 * Three-pass event matching:
 * 1. Exact msrEventId match (fastest, most accurate on re-sync)
 * 2. registrationUrl contains the MSR detail URI
 * 3. Fuzzy: same name (case-insensitive) + start date within ±7 days
 */
async function findExistingEvent(
  userId: string,
  msrEvent: MsrEventResult,
  existingByMsrId: Map<string, string>,
  existingByUrl: Map<string, string>,
): Promise<string | null> {
  // Pass 1: msrEventId
  if (msrEvent.msrEventId) {
    const id = existingByMsrId.get(msrEvent.msrEventId);
    if (id) return id;
  }

  // Pass 2: registrationUrl
  if (msrEvent.registrationUrl) {
    const id = existingByUrl.get(msrEvent.registrationUrl.toLowerCase());
    if (id) return id;
  }

  // Pass 3: fuzzy name + date
  if (msrEvent.name && msrEvent.startDate) {
    const startDate = parseDateOnly(msrEvent.startDate);
    const windowStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const fuzzy = await prisma.event.findFirst({
      where: {
        userId,
        name: { equals: msrEvent.name, mode: "insensitive" },
        startDate: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true },
    });

    if (fuzzy) return fuzzy.id;
  }

  return null;
}

// ─── Server actions ───────────────────────────────────────────────────────────

export async function syncMsrEvents(
  _prevState: MsrSyncState,
  _formData: FormData,
): Promise<MsrSyncState> {
  const userId = await requireAuth();

  if (!msrCredsPresent()) {
    return { error: "MSR integration not configured on this server." };
  }

  const account = await getMsrAccount(userId);
  if (!account) {
    return {
      error: "No MSR account connected. Please connect MotorsportReg first.",
    };
  }

  const msrEvents = await fetchMyEvents(userId);
  if (!msrEvents.length) {
    return { data: { created: 0, matched: 0 } };
  }

  // Pre-fetch existing events for efficient lookup in passes 1 and 2.
  const existing = await prisma.event.findMany({
    where: { userId },
    select: { id: true, msrEventId: true, registrationUrl: true },
  });

  const existingByMsrId = new Map<string, string>();
  const existingByUrl = new Map<string, string>();
  for (const ev of existing) {
    if (ev.msrEventId) existingByMsrId.set(ev.msrEventId, ev.id);
    if (ev.registrationUrl)
      existingByUrl.set(ev.registrationUrl.toLowerCase(), ev.id);
  }

  let created = 0;
  let matched = 0;

  for (const msrEvent of msrEvents) {
    const existingId = await findExistingEvent(
      userId,
      msrEvent,
      existingByMsrId,
      existingByUrl,
    );

    if (existingId) {
      // Stamp the msrEventId onto an event that was previously imported without it.
      if (msrEvent.msrEventId) {
        await prisma.event.update({
          where: { id: existingId, userId },
          data: { msrEventId: msrEvent.msrEventId },
        });
      }
      matched++;
    } else {
      // Create a new event from the MSR registration.
      if (!msrEvent.name || !msrEvent.startDate) continue;

      await prisma.event.create({
        data: {
          userId,
          name: msrEvent.name,
          type: msrEvent.type ?? "Other",
          organizingBody: msrEvent.organizingBody ?? null,
          startDate: parseDateOnly(msrEvent.startDate),
          endDate: msrEvent.endDate ? parseDateOnly(msrEvent.endDate) : null,
          startTime: msrEvent.startTime ?? null,
          endTime: msrEvent.endTime ?? null,
          venueName: msrEvent.venueName ?? null,
          address: msrEvent.address ?? null,
          registrationUrl: msrEvent.registrationUrl ?? null,
          registrationDeadline: msrEvent.registrationDeadline
            ? parseDateOnly(msrEvent.registrationDeadline)
            : null,
          registrationStatus: "Registered",
          msrEventId: msrEvent.msrEventId ?? null,
        },
      });
      created++;
    }
  }

  revalidatePath("/events");

  return { data: { created, matched } };
}

export async function disconnectMsr(
  _prevState: MsrSyncState,
  _formData: FormData,
): Promise<MsrSyncState> {
  const userId = await requireAuth();

  await prisma.account.deleteMany({
    where: { userId, provider: "motorsportreg" },
  });

  revalidatePath("/settings/integrations");

  return { data: { created: 0, matched: 0 } };
}
