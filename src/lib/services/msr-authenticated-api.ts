// Server-only — never import this from client components.
// Authenticated MSR API client — requires user to have connected their MSR account.
// All functions return null/[] on failure — never throw.

import { prisma } from "@/lib/prisma";
import { msrCredsPresent, msrFetch } from "@/lib/services/msr-oauth";
import type { ScrapedEventData } from "@/lib/services/motorsportreg-scraper";
import { mapMsrType } from "@/lib/services/motorsportreg-api";

// ─── MSR response types ───────────────────────────────────────────────────────

interface MsrProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileId?: string;
}

interface MsrOrg {
  id?: string;
  name?: string;
}

interface MsrMeResponse {
  response?: {
    profile?: unknown;
    organization?: unknown[] | unknown;
  };
}

interface MsrEventRegistration {
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
  status?: string;
}

interface MsrMyEventsResponse {
  response?: {
    events?: unknown[];
  };
}

// ─── Type guards ──────────────────────────────────────────────────────────────

function isMsrProfile(v: unknown): v is MsrProfile {
  return typeof v === "object" && v !== null;
}

function isMsrOrg(v: unknown): v is MsrOrg {
  return typeof v === "object" && v !== null;
}

function isMsrEventRegistration(v: unknown): v is MsrEventRegistration {
  return typeof v === "object" && v !== null;
}

function isMsrMeResponse(v: unknown): v is MsrMeResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.response === "object" && obj.response !== null;
}

function isMsrMyEventsResponse(v: unknown): v is MsrMyEventsResponse {
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

// ─── Internal: get stored MSR tokens for a user ───────────────────────────────

interface MsrAccount {
  accessToken: string;
  accessTokenSecret: string;
  profileId: string;
}

export async function getMsrAccount(
  userId: string,
): Promise<MsrAccount | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "motorsportreg" },
    select: {
      access_token: true,
      access_token_secret: true,
      providerAccountId: true,
    },
  });

  if (!account?.access_token || !account.access_token_secret) return null;

  return {
    accessToken: account.access_token,
    accessTokenSecret: account.access_token_secret,
    profileId: account.providerAccountId,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the connected user's MSR profile and org memberships.
 */
export async function fetchMyProfile(
  userId: string,
): Promise<{ profile: MsrProfile; orgs: MsrOrg[] } | null> {
  if (!msrCredsPresent()) return null;
  const account = await getMsrAccount(userId);
  if (!account) return null;

  const res = await msrFetch(
    "/rest/me.json",
    "GET",
    account.accessToken,
    account.accessTokenSecret,
  );
  if (!res?.ok) return null;

  const data: unknown = await res.json();
  if (!isMsrMeResponse(data)) return null;

  const responseObj = data.response;
  const profile = isMsrProfile(responseObj?.profile) ? responseObj.profile : {};
  const orgRaw = responseObj?.organization;
  const orgs: MsrOrg[] = Array.isArray(orgRaw)
    ? orgRaw.filter(isMsrOrg)
    : isMsrOrg(orgRaw)
      ? [orgRaw]
      : [];

  return { profile, orgs };
}

export interface MsrEventResult extends ScrapedEventData {
  msrEventId?: string;
  msrStatus?: string;
}

/**
 * Fetch the connected user's event registrations from MSR.
 */
export async function fetchMyEvents(userId: string): Promise<MsrEventResult[]> {
  if (!msrCredsPresent()) return [];
  const account = await getMsrAccount(userId);
  if (!account) return [];

  const res = await msrFetch(
    "/rest/me/events.json",
    "GET",
    account.accessToken,
    account.accessTokenSecret,
  );
  if (!res?.ok) return [];

  const data: unknown = await res.json();
  if (!isMsrMyEventsResponse(data)) return [];

  const events = data.response?.events ?? [];
  if (!Array.isArray(events)) return [];

  return events
    .filter(isMsrEventRegistration)
    .map((ev): MsrEventResult => {
      const result: MsrEventResult = {};

      if (ev.eventId) result.msrEventId = String(ev.eventId);
      if (ev.status) result.msrStatus = ev.status;
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
    })
    .filter((e) => e.name);
}
