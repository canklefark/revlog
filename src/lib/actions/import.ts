"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/event";
import {
  extractOrgId,
  fetchOrgCalendar,
  isMsrUrl,
  isValidOrgId,
} from "@/lib/services/motorsportreg-api";
import type { ScrapedEventData } from "@/lib/services/motorsportreg-scraper";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FetchOrgEventsState = {
  data?: ScrapedEventData[];
  error?: string;
};

export type BulkCreateState = {
  data?: { created: number; skipped: number };
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetch upcoming events from an MSR organization calendar.
 * Accepts an MSR org URL, an API calendar URL, or a raw org UUID.
 */
export async function fetchOrgEvents(
  _prevState: FetchOrgEventsState,
  formData: FormData,
): Promise<FetchOrgEventsState> {
  await requireAuth();

  const input = formData.get("orgInput");
  if (!input || typeof input !== "string" || !input.trim()) {
    return { error: "Please enter an MSR organization URL or ID." };
  }

  const trimmed = input.trim();

  // Quick validation: must look like an MSR URL or a UUID
  if (!isMsrUrl(trimmed) && !isValidOrgId(trimmed)) {
    return {
      error:
        "Enter a motorsportreg.com URL (e.g. https://www.motorsportreg.com/events/...) or an organization ID.",
    };
  }

  const orgId = await extractOrgId(trimmed);
  if (!orgId) {
    return {
      error:
        "Could not find an organization ID in that URL. Try pasting the org's events page URL or the org ID directly.",
    };
  }

  const events = await fetchOrgCalendar(orgId);
  if (events.length === 0) {
    return {
      error:
        "No upcoming events found for that organization. The API may require prior approval or the org has no scheduled events.",
    };
  }

  return { data: events };
}

/**
 * Bulk-create events from a JSON-encoded array of ScrapedEventData.
 * Skips events whose registrationUrl already exists for this user.
 * Skips geocoding — users can trigger it by editing events later.
 */
export async function bulkCreateEvents(
  _prevState: BulkCreateState,
  formData: FormData,
): Promise<BulkCreateState> {
  const userId = await requireAuth();

  const raw = formData.get("events");
  if (!raw || typeof raw !== "string") {
    return { error: "No events provided." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid event data." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "No events to import." };
  }

  // Collect registrationUrls from selected events so we can deduplicate
  const inputUrls: string[] = parsed
    .map((e: unknown) => {
      if (typeof e === "object" && e !== null) {
        const obj = e as Record<string, unknown>;
        return typeof obj.registrationUrl === "string"
          ? obj.registrationUrl
          : null;
      }
      return null;
    })
    .filter((u): u is string => u !== null && u.length > 0);

  // Find already-imported events by registrationUrl (scoped to user)
  const existingUrls = new Set(
    inputUrls.length > 0
      ? (
          await prisma.event.findMany({
            where: { userId, registrationUrl: { in: inputUrls } },
            select: { registrationUrl: true },
          })
        )
          .map((e) => e.registrationUrl)
          .filter((u): u is string => u !== null)
      : [],
  );

  // Validate and build create payloads
  type CreatePayload = {
    userId: string;
    name: string;
    type: string;
    organizingBody?: string | null;
    startDate: Date;
    endDate: Date | null;
    startTime?: string | null;
    endTime?: string | null;
    venueName?: string | null;
    address?: string | null;
    registrationStatus: string;
    registrationDeadline: Date | null;
    entryFee?: number | null;
    registrationUrl?: string | null;
    runGroup?: string | null;
    notes?: string | null;
    carId?: string | null;
  };

  const toCreate: CreatePayload[] = [];
  let skipped = 0;

  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      skipped++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    // Skip already-imported events
    if (
      typeof obj.registrationUrl === "string" &&
      existingUrls.has(obj.registrationUrl)
    ) {
      skipped++;
      continue;
    }

    // Validate via createEventSchema
    const validated = createEventSchema.safeParse({
      name: obj.name,
      type: obj.type ?? "Other",
      organizingBody: obj.organizingBody || undefined,
      startDate: obj.startDate,
      endDate: obj.endDate || undefined,
      startTime: obj.startTime || undefined,
      endTime: obj.endTime || undefined,
      venueName: obj.venueName || undefined,
      address: obj.address || undefined,
      registrationStatus: "Interested",
      registrationDeadline: obj.registrationDeadline || undefined,
      entryFee: obj.entryFee,
      registrationUrl: obj.registrationUrl || undefined,
    });

    if (!validated.success) {
      skipped++;
      continue;
    }

    const d = validated.data;
    toCreate.push({
      userId,
      name: d.name,
      type: d.type,
      organizingBody: d.organizingBody ?? null,
      startDate: parseDateOnly(d.startDate),
      endDate: d.endDate ? parseDateOnly(d.endDate) : null,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
      venueName: d.venueName ?? null,
      address: d.address ?? null,
      registrationStatus: d.registrationStatus,
      registrationDeadline: d.registrationDeadline
        ? parseDateOnly(d.registrationDeadline)
        : null,
      entryFee: d.entryFee ?? null,
      registrationUrl: d.registrationUrl || null,
      runGroup: null,
      notes: null,
      carId: null,
    });
  }

  if (toCreate.length === 0) {
    return {
      data: { created: 0, skipped },
    };
  }

  try {
    // Use createMany for efficiency — no geocoding during bulk import
    await prisma.event.createMany({ data: toCreate });
    revalidatePath("/events");
    return { data: { created: toCreate.length, skipped } };
  } catch {
    return { error: "Failed to import events. Please try again." };
  }
}
