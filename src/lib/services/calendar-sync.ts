// Server-only — never import this from client components.
// All functions no-op (return null) if GOOGLE_CLIENT_ID or
// GOOGLE_CLIENT_SECRET are not set.

import { prisma } from "@/lib/prisma";

export interface CalendarEventData {
  title: string; // e.g. "[AutoX] SCCA Points Event #3"
  startDate: Date;
  endDate: Date | null;
  startTime: string | null; // HH:MM, 24h
  endTime: string | null; // HH:MM, 24h
  userTimezone: string; // IANA timezone, e.g. "America/Chicago"
  location: string | null;
  description: string; // organizing body, fee, run group, url, notes
}

// ─── Type guards for Google API responses ────────────────────────────────────

interface GoogleCalendarEventCreated {
  id: string;
  status: string;
}

function isGoogleCalendarEventCreated(
  data: unknown,
): data is GoogleCalendarEventCreated {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.id === "string" && typeof obj.status === "string";
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

function isGoogleTokenResponse(data: unknown): data is GoogleTokenResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.access_token === "string" && typeof obj.token_type === "string"
  );
}

interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarListItem[];
}

function isGoogleCalendarListItem(
  value: unknown,
): value is GoogleCalendarListItem {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "string" && typeof obj.summary === "string";
}

function isGoogleCalendarListResponse(
  data: unknown,
): data is GoogleCalendarListResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.items) && obj.items.every(isGoogleCalendarListItem);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function credsPresent(): boolean {
  return (
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET)
  );
}

/** Fetch the Google Account record for the user. Returns null if not found. */
async function getUserGoogleAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
    },
  });
}

/** Attempt a token refresh. Updates the Account row and returns the new token,
 *  or returns null on failure. */
async function refreshAccessToken(
  accountId: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!isGoogleTokenResponse(data)) return null;

    // Persist the new access token so subsequent calls don't have to refresh again.
    await prisma.account.update({
      where: { id: accountId },
      data: {
        access_token: data.access_token,
        ...(data.expires_in
          ? {
              expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
            }
          : {}),
      },
    });

    return data.access_token;
  } catch {
    return null;
  }
}

/** Extract "YYYY-MM-DD" from a Date stored at noon UTC. */
function toDateStr(d: Date): string {
  return d.toISOString().substring(0, 10);
}

/** Build a Google Calendar event body from CalendarEventData. */
function buildEventBody(eventData: CalendarEventData) {
  const base = {
    summary: eventData.title,
    location: eventData.location ?? undefined,
    description: eventData.description,
  };

  if (eventData.startTime) {
    // Timed event — use dateTime format with the user's local timezone.
    const startStr = `${toDateStr(eventData.startDate)}T${eventData.startTime}:00`;
    const endDateStr = eventData.endDate
      ? toDateStr(eventData.endDate)
      : toDateStr(eventData.startDate);
    const endTimeStr = eventData.endTime ?? "23:59";
    const endStr = `${endDateStr}T${endTimeStr}:00`;
    return {
      ...base,
      start: { dateTime: startStr, timeZone: eventData.userTimezone },
      end: { dateTime: endStr, timeZone: eventData.userTimezone },
    };
  }

  // All-day event — use date format. Google Calendar end is exclusive, so
  // add 1 day to the last day of the event.
  const startDate = toDateStr(eventData.startDate);
  const lastDay = eventData.endDate ?? eventData.startDate;
  const exclusiveEnd = new Date(lastDay.getTime() + 86_400_000);
  const endDate = toDateStr(exclusiveEnd);

  return {
    ...base,
    start: { date: startDate },
    end: { date: endDate },
  };
}

/** Make an authenticated request to the Google Calendar API, retrying once
 *  with a fresh token on 401.  Returns the response or null on error. */
async function calendarFetch(
  url: string,
  method: string,
  accountId: string,
  accessToken: string,
  refreshToken: string | null,
  body?: Record<string, unknown>,
): Promise<Response | null> {
  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  try {
    let res = await makeRequest(accessToken);

    // On 401, try to refresh once.
    if (res.status === 401 && refreshToken) {
      const newToken = await refreshAccessToken(accountId, refreshToken);
      if (!newToken) return null;
      res = await makeRequest(newToken);
    }

    return res;
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  userId: string,
  eventData: CalendarEventData,
): Promise<string | null> {
  if (!credsPresent()) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendarSyncEnabled: true,
        calendarId: true,
        calendarProvider: true,
      },
    });

    if (!user?.calendarSyncEnabled) return null;
    if (user.calendarProvider !== "google") return null;

    const calendarId = user.calendarId ?? "primary";
    const account = await getUserGoogleAccount(userId);
    if (!account?.access_token) return null;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const res = await calendarFetch(
      url,
      "POST",
      account.id,
      account.access_token,
      account.refresh_token ?? null,
      buildEventBody(eventData) as Record<string, unknown>,
    );

    if (!res || !res.ok) return null;

    const data: unknown = await res.json();
    if (!isGoogleCalendarEventCreated(data)) return null;

    return data.id;
  } catch {
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  eventData: CalendarEventData,
): Promise<boolean> {
  if (!credsPresent()) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendarSyncEnabled: true,
        calendarId: true,
        calendarProvider: true,
      },
    });

    if (!user?.calendarSyncEnabled) return false;
    if (user.calendarProvider !== "google") return false;

    const calendarId = user.calendarId ?? "primary";
    const account = await getUserGoogleAccount(userId);
    if (!account?.access_token) return false;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`;
    const res = await calendarFetch(
      url,
      "PATCH",
      account.id,
      account.access_token,
      account.refresh_token ?? null,
      buildEventBody(eventData) as Record<string, unknown>,
    );

    return res?.ok ?? false;
  } catch {
    return false;
  }
}

export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string,
): Promise<boolean> {
  if (!credsPresent()) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendarSyncEnabled: true,
        calendarId: true,
        calendarProvider: true,
      },
    });

    if (!user?.calendarSyncEnabled) return false;
    if (user.calendarProvider !== "google") return false;

    const calendarId = user.calendarId ?? "primary";
    const account = await getUserGoogleAccount(userId);
    if (!account?.access_token) return false;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`;
    const res = await calendarFetch(
      url,
      "DELETE",
      account.id,
      account.access_token,
      account.refresh_token ?? null,
    );

    // 204 No Content = success; treat 410 Gone as already deleted (success).
    return res !== null && (res.status === 204 || res.status === 410);
  } catch {
    return false;
  }
}

/** List the user's Google Calendars. Returns empty array on error or missing
 *  credentials. */
export async function listUserCalendars(
  userId: string,
): Promise<GoogleCalendarListItem[]> {
  if (!credsPresent()) return [];

  try {
    const account = await getUserGoogleAccount(userId);
    if (!account?.access_token) return [];

    const url = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
    const res = await calendarFetch(
      url,
      "GET",
      account.id,
      account.access_token,
      account.refresh_token ?? null,
    );

    if (!res || !res.ok) return [];

    const data: unknown = await res.json();
    if (!isGoogleCalendarListResponse(data)) return [];

    return data.items;
  } catch {
    return [];
  }
}
