// Server-only — never import this from client components.
// Wraps the unauthenticated MotorsportReg organization calendar API.
// Returns empty array / null on any error — never throws.

import type { ScrapedEventData } from "./motorsportreg-scraper";
import { inferEventType } from "@/lib/utils/infer-event-type";
import type { EventType } from "@/lib/constants/event-types";
import { EVENT_TYPES } from "@/lib/constants/event-types";

// ─── MSR API response types ──────────────────────────────────────────────────

interface MsrVenue {
  name?: string;
  city?: string;
  region?: string;
  address?: string;
}

interface MsrRegistration {
  start?: string;
  end?: string; // registration close date
}

interface MsrCalendarEvent {
  name?: string;
  type?: string;
  start?: string; // ISO datetime or date string
  end?: string;
  venue?: MsrVenue;
  detailuri?: string;
  registration?: MsrRegistration;
}

interface MsrCalendarResponse {
  response?: {
    events?: unknown[];
  };
}

function isMsrCalendarEvent(v: unknown): v is MsrCalendarEvent {
  return typeof v === "object" && v !== null;
}

function isMsrCalendarResponse(v: unknown): v is MsrCalendarResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  if (typeof obj.response !== "object" || obj.response === null) return false;
  return true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract "YYYY-MM-DD" from an ISO datetime or date string. */
function toDateStr(raw: string): string | undefined {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : undefined;
}

/** Extract "HH:mm" from an ISO datetime string. */
function toTimeStr(raw: string): string | undefined {
  const match = raw.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : undefined;
}

// MSR type strings → our EventType enum
const MSR_TYPE_MAP: Record<string, EventType> = {
  autocross: "Autocross",
  "auto cross": "Autocross",
  rallycross: "RallyCross",
  "rally cross": "RallyCross",
  hpde: "HPDE",
  "high performance driving event": "HPDE",
  "track day": "Track Day",
  "time trial": "Time Attack",
  "time attack": "Time Attack",
  "test & tune": "Test & Tune",
  "test and tune": "Test & Tune",
  "practice session": "Practice Session",
  "hill climb": "Hill Climb",
  hillclimb: "Hill Climb",
  endurance: "Endurance",
  drift: "Drift",
  drag: "Drag",
  "drag race": "Drag",
};

function mapMsrType(msrType: string, name?: string): EventType {
  const normalized = msrType.toLowerCase().trim();
  const mapped = MSR_TYPE_MAP[normalized];
  if (mapped) return mapped;

  // Try partial match
  for (const [key, value] of Object.entries(MSR_TYPE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }

  // Fall back to inferring from event name
  if (name) {
    const inferred = inferEventType(name);
    if (inferred) return inferred;
  }

  return "Other";
}

function mapMsrEvent(ev: MsrCalendarEvent): ScrapedEventData {
  const result: ScrapedEventData = {};

  if (ev.name?.trim()) result.name = ev.name.trim();
  if (ev.type) result.type = mapMsrType(ev.type, ev.name);
  if (ev.start) {
    const d = toDateStr(ev.start);
    if (d) result.startDate = d;
    const t = toTimeStr(ev.start);
    if (t) result.startTime = t;
  }
  if (ev.end) {
    const d = toDateStr(ev.end);
    if (d) result.endDate = d;
    const t = toTimeStr(ev.end);
    if (t) result.endTime = t;
  }
  if (ev.venue?.name?.trim()) result.venueName = ev.venue.name.trim();

  // Build address from city + region if no full address provided
  if (ev.venue?.address?.trim()) {
    result.address = ev.venue.address.trim();
  } else if (ev.venue?.city || ev.venue?.region) {
    const parts = [ev.venue.city, ev.venue.region].filter(Boolean);
    if (parts.length > 0) result.address = parts.join(", ");
  }

  if (ev.detailuri?.trim()) result.registrationUrl = ev.detailuri.trim();

  // Registration close date (if present)
  if (ev.registration?.end) {
    const d = toDateStr(ev.registration.end);
    if (d) result.registrationDeadline = d;
  }

  return result;
}

// ─── Org ID extraction ────────────────────────────────────────────────────────

// MSR org IDs are 35-char lowercase hex GUIDs with hyphens, e.g.:
// "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (standard UUID format)
const ORG_ID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Extract an MSR organization ID from a URL or raw string.
 * Handles:
 *   - Direct org ID (UUID format)
 *   - /rest/calendars/organization/{id} API URLs
 *   - motorsportreg.com org/event page URLs (fetches page to find org ID)
 * Returns null if extraction fails.
 */
export async function extractOrgId(input: string): Promise<string | null> {
  const trimmed = input.trim();

  // Direct UUID paste
  if (ORG_ID_PATTERN.test(trimmed) && !trimmed.includes("/")) {
    return trimmed.toLowerCase();
  }

  // API URL: extract directly
  const apiMatch = trimmed.match(
    /\/rest\/calendars\/organization\/([0-9a-f-]{36})/i,
  );
  if (apiMatch) return apiMatch[1].toLowerCase();

  // motorsportreg.com URL: fetch the page and look for the org ID in embedded links
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.endsWith("motorsportreg.com")) return null;

    const res = await fetch(trimmed, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RevLog/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Look for org ID in embedded calendar/API links within the page
    const match = html.match(
      /\/rest\/calendars\/organization\/([0-9a-f-]{36})/i,
    );
    if (match) return match[1].toLowerCase();

    // Also check for org ID in JSON-LD or data attributes
    const dataMatch = html.match(
      /["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i,
    );
    if (dataMatch) return dataMatch[1].toLowerCase();
  } catch {
    return null;
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch all upcoming events for an MSR organization.
 * Uses the unauthenticated calendar API endpoint.
 * Returns an empty array on any error.
 */
export async function fetchOrgCalendar(
  orgId: string,
): Promise<ScrapedEventData[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.motorsportreg.com/rest/calendars/organization/${encodeURIComponent(orgId)}.json?exclude_cancelled=true&start=${today}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.pukkasoft+json",
        "User-Agent": "Mozilla/5.0 (compatible; RevLog/1.0)",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const data: unknown = await res.json();
    if (!isMsrCalendarResponse(data)) return [];

    const events = data.response?.events ?? [];
    if (!Array.isArray(events)) return [];

    return events
      .filter(isMsrCalendarEvent)
      .map(mapMsrEvent)
      .filter((e) => e.name); // require at least a name
  } catch {
    return [];
  }
}

/** Validate that an org ID looks like a UUID. */
export function isValidOrgId(id: string): boolean {
  return ORG_ID_PATTERN.test(id.trim());
}

/** Check if a URL is a motorsportreg.com URL. */
export function isMsrUrl(input: string): boolean {
  try {
    return new URL(input).hostname.endsWith("motorsportreg.com");
  } catch {
    return false;
  }
}

// Re-export EVENT_TYPES membership check for the type map keys
export const _supportedEventTypes = EVENT_TYPES;
