// Server-only — never import this from client components.
// Authenticated MSR global calendar search — requires connected MSR account.
// Returns empty array on any error — never throws.
import "server-only";

import { msrCredsPresent, msrFetch } from "@/lib/services/msr-oauth";
import {
  getMsrAccount,
  type MsrAccount,
  type MsrEventResult,
} from "@/lib/services/msr-authenticated-api";
import { mapMsrType } from "@/lib/services/motorsportreg-api";

// ─── MSR response types ───────────────────────────────────────────────────────

interface MsrSearchEvent {
  eventId?: string;
  name?: string;
  type?: string;
  start?: string;
  end?: string;
  venue?: {
    name?: string;
    city?: string;
    region?: string;
    address?: string;
  };
  detailuri?: string;
  registration?: {
    end?: string;
  };
}

interface MsrSearchResponse {
  response?: {
    events?: unknown[];
  };
}

// ─── Type guards ──────────────────────────────────────────────────────────────

function isMsrSearchEvent(v: unknown): v is MsrSearchEvent {
  return typeof v === "object" && v !== null;
}

function isMsrSearchResponse(v: unknown): v is MsrSearchResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.response === "object" && obj.response !== null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(raw: string): string | undefined {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : undefined;
}

function toTimeStr(raw: string): string | undefined {
  const match = raw.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : undefined;
}

function mapSearchEvent(ev: MsrSearchEvent): MsrEventResult {
  const result: MsrEventResult = {};

  if (ev.eventId) result.msrEventId = String(ev.eventId);
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
  if (ev.venue?.address?.trim()) {
    result.address = ev.venue.address.trim();
  } else if (ev.venue?.city || ev.venue?.region) {
    const parts = [ev.venue.city, ev.venue.region].filter(Boolean);
    if (parts.length) result.address = parts.join(", ");
  }
  if (ev.detailuri?.trim()) result.registrationUrl = ev.detailuri.trim();
  if (ev.registration?.end) {
    const d = toDateStr(ev.registration.end);
    if (d) result.registrationDeadline = d;
  }

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface MsrSearchParams {
  postalcode?: string;
  radius?: number;
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  country?: string; // ISO 3166-1 ALPHA-2
}

/**
 * Search all MSR events using the authenticated global calendar endpoint.
 * Supports geospatial filtering via postalcode + radius.
 */
export async function searchMsrCalendars(
  userId: string,
  params: MsrSearchParams,
  prefetchedAccount?: MsrAccount,
): Promise<MsrEventResult[]> {
  if (!msrCredsPresent()) return [];
  const account = prefetchedAccount ?? (await getMsrAccount(userId));
  if (!account) return [];

  const qs = new URLSearchParams({ exclude_cancelled: "true" });
  if (params.postalcode) qs.set("postalcode", params.postalcode);
  if (params.radius) qs.set("radius", String(params.radius));
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.country) qs.set("country", params.country);

  const url = `/rest/calendars.json?${qs.toString()}`;
  const res = await msrFetch(
    url,
    "GET",
    account.accessToken,
    account.accessTokenSecret,
  );
  if (!res?.ok) {
    console.error(
      `[msr-search] API error: ${res?.status} ${res?.statusText} — ${url}`,
    );
    if (res) {
      const body = await res.text().catch(() => "");
      console.error(`[msr-search] response body:`, body.slice(0, 500));
    }
    return [];
  }

  const data: unknown = await res.json();
  if (!isMsrSearchResponse(data)) {
    console.error(
      `[msr-search] unexpected response shape:`,
      JSON.stringify(data).slice(0, 500),
    );
    return [];
  }

  const events = data.response?.events ?? [];
  if (!Array.isArray(events)) return [];

  return events
    .filter(isMsrSearchEvent)
    .map(mapSearchEvent)
    .filter((e) => e.name);
}
