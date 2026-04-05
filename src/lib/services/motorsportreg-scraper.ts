// Server-only — never import this from client components.
// Best-effort scraper: partial results are acceptable. Never throws.

import * as cheerio from "cheerio";
import { inferEventType } from "@/lib/utils/infer-event-type";

export interface ScrapedEventData {
  name?: string;
  type?: string;
  organizingBody?: string;
  startDate?: string; // ISO date string "YYYY-MM-DD"
  endDate?: string; // ISO date string "YYYY-MM-DD"
  startTime?: string; // "HH:mm" 24h
  endTime?: string; // "HH:mm" 24h
  venueName?: string;
  address?: string;
  entryFee?: number;
  registrationDeadline?: string; // ISO date string "YYYY-MM-DD"
  registrationUrl?: string;
}

function toIsoDateString(raw: string): string | undefined {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

/** Extract "HH:mm" from an ISO datetime string like "2026-05-15T08:00:00". */
function toTimeString(raw: string): string | undefined {
  const match = raw.match(/T(\d{2}:\d{2})/);
  if (!match) return undefined;
  return match[1];
}

// Month name → zero-padded month number
const MONTH_MAP: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

/**
 * Parse a natural-language date like "Saturday, June 6, 2026" into "YYYY-MM-DD".
 * Also handles "June 6, 2026" without the day name.
 */
function parseNaturalDate(raw: string): string | undefined {
  // Strip optional leading day name: "Saturday, June 6, 2026" → "June 6, 2026"
  const stripped = raw.replace(/^[A-Za-z]+,\s*/, "").trim();
  // "June 6, 2026" or "June 06, 2026"
  const match = stripped.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match) return undefined;
  const month = MONTH_MAP[match[1].toLowerCase()];
  if (!month) return undefined;
  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

/**
 * MSR's og:description follows a predictable pattern for event pages:
 *   "{Organizer} on {Day}, {Month} {D}, {YYYY}[ - {Day}, {Month} {D}, {YYYY}] at {Venue}, {City}, {ST} - {rest}"
 *
 * Returns whatever fields we can extract; missing fields are simply absent.
 */
function parseMsrOgDescription(desc: string): Partial<ScrapedEventData> {
  const result: Partial<ScrapedEventData> = {};

  // ── Organizer ────────────────────────────────────────────────────────────
  // Text before " on [Day], Month D, YYYY"
  const onIdx = desc.search(/ on [A-Za-z]+,\s+[A-Za-z]+ \d/);
  if (onIdx > 0) {
    result.organizingBody = desc.slice(0, onIdx).trim();
  }

  // ── Dates ─────────────────────────────────────────────────────────────────
  // Pattern: "on Saturday, June 6, 2026 - Sunday, June 7, 2026 at"
  //       or "on Saturday, June 6, 2026 at"
  const dateRangeMatch = desc.match(
    / on ([A-Za-z]+,\s+[A-Za-z]+ \d{1,2},\s+\d{4})\s*-\s*([A-Za-z]+,\s+[A-Za-z]+ \d{1,2},\s+\d{4})\s+at\s/,
  );
  const singleDateMatch = desc.match(
    / on ([A-Za-z]+,\s+[A-Za-z]+ \d{1,2},\s+\d{4})\s+at\s/,
  );

  if (dateRangeMatch) {
    const start = parseNaturalDate(dateRangeMatch[1]);
    const end = parseNaturalDate(dateRangeMatch[2]);
    if (start) result.startDate = start;
    if (end) result.endDate = end;
  } else if (singleDateMatch) {
    const start = parseNaturalDate(singleDateMatch[1]);
    if (start) result.startDate = start;
  }

  // ── Venue + address ───────────────────────────────────────────────────────
  // Text after "at " up to the first " - " or end of string
  // e.g. "at Barber Motorsports Park, Birmingham, AL - description..."
  const atMatch = desc.match(/ at ([^-]+?)(?:\s+-\s+|$)/);
  if (atMatch) {
    const locationStr = atMatch[1].trim();
    // Split "Venue Name, City, ST" — venue is first part, city+state is rest
    const parts = locationStr.split(",").map((s) => s.trim());
    if (parts.length >= 3) {
      result.venueName = parts[0];
      // City + state as address
      result.address = parts.slice(1).join(", ");
    } else if (parts.length === 2) {
      result.venueName = parts[0];
      result.address = parts[1];
    } else if (parts.length === 1 && parts[0]) {
      result.venueName = parts[0];
    }
  }

  // ── Event type from full description text ─────────────────────────────────
  const inferred = inferEventType(desc);
  if (inferred) result.type = inferred;

  return result;
}

export async function scrapeMotorsportReg(
  url: string,
): Promise<Partial<ScrapedEventData> | null> {
  try {
    // Security: only allow motorsportreg.com URLs.
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("motorsportreg.com")) {
      return null;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RevLog/1.0)",
        Accept: "text/html",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const result: Partial<ScrapedEventData> = {};

    // ── Event name ───────────────────────────────────────────────────────────
    // MSR is a Vue SPA: the first h1 is an empty SSR placeholder.
    // Find the first h1 with actual text content.
    $("h1").each((_i, el) => {
      if (result.name) return false;
      // Get only direct text nodes (not descendant elements) to avoid
      // picking up injected content like CCPA icon SVG <title> text.
      const directText = $(el)
        .contents()
        .filter((_j, node) => node.type === "text")
        .map((_j, node) => (node as { data?: string }).data ?? "")
        .get()
        .join("")
        .trim();
      if (directText) result.name = directText;
    });

    // Fall back to HTML <title> — use "head title" to avoid SVG <title> elements
    // (CCPA opt-out icons embed SVG with <title> tags that pollute $("title").text())
    if (!result.name) {
      const htmlTitle = $("head title")
        .first()
        .text()
        .trim()
        .split("|")[0]
        .trim();
      if (htmlTitle) result.name = htmlTitle;
    }

    // ── Event type from hero ".organiser__meta a" ────────────────────────────
    // MSR SSR renders: <a href="/calendar/hpde-driver-school/">HPDE</a> organized by
    // This is more reliable than inferring from og:description text.
    const organiserTypeText = $('[class*="organiser__meta"] a')
      .first()
      .text()
      .trim();
    if (organiserTypeText) {
      const inferred = inferEventType(organiserTypeText);
      if (inferred) result.type = inferred;
    }

    // ── og:description — primary data source for MSR SPAs ────────────────────
    // MSR event pages include rich og:description with organizer, dates, and venue.
    // Example: "Jzilla Track Days on Saturday, June 6, 2026 - Sunday, June 7, 2026
    //           at Barber Motorsports Park, Birmingham, AL - JZILLA TRACK DAYS..."
    const ogDesc = $('meta[property="og:description"]').attr("content");
    if (ogDesc) {
      const fromDesc = parseMsrOgDescription(ogDesc);
      if (fromDesc.organizingBody)
        result.organizingBody = fromDesc.organizingBody;
      if (fromDesc.startDate) result.startDate = fromDesc.startDate;
      if (fromDesc.endDate) result.endDate = fromDesc.endDate;
      if (fromDesc.venueName) result.venueName = fromDesc.venueName;
      if (fromDesc.address) result.address = fromDesc.address;
      // Only use og:description type if hero didn't already give us one
      if (!result.type && fromDesc.type) result.type = fromDesc.type;
    }

    // ── Dates (itemprop fallback for non-SPA MSR pages) ──────────────────────
    if (!result.startDate) {
      const startDateMeta = $('[itemprop="startDate"]').first();
      if (startDateMeta.length) {
        const raw =
          startDateMeta.attr("content") ??
          startDateMeta.attr("datetime") ??
          startDateMeta.text().trim();
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.startDate = iso;
          const time = toTimeString(raw);
          if (time) result.startTime = time;
        }
      }
    }

    if (!result.startDate) {
      const datetimeEl = $("[datetime]").first();
      if (datetimeEl.length) {
        const raw = datetimeEl.attr("datetime");
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.startDate = iso;
          const time = toTimeString(raw);
          if (time) result.startTime = time;
        }
      }
    }

    if (!result.endDate) {
      const endDateMeta = $('[itemprop="endDate"]').first();
      if (endDateMeta.length) {
        const raw =
          endDateMeta.attr("content") ??
          endDateMeta.attr("datetime") ??
          endDateMeta.text().trim();
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.endDate = iso;
          const time = toTimeString(raw);
          if (time) result.endTime = time;
        }
      }
    }

    // ── Organization (itemprop fallback) ─────────────────────────────────────
    if (!result.organizingBody) {
      const org = $(
        '[class*="organiz"], [class*="club"], [itemprop="organizer"]',
      )
        .first()
        .text()
        .trim();
      if (org) result.organizingBody = org;
    }

    // ── Venue / address (itemprop fallback) ──────────────────────────────────
    if (!result.venueName) {
      const venue = $(
        '[itemprop="location"] [itemprop="name"], [itemprop="location"]',
      )
        .first()
        .text()
        .trim();
      if (venue) result.venueName = venue;
    }

    if (!result.address) {
      const address = $('[itemprop="address"]').first().text().trim();
      if (address) result.address = address;
    }

    // ── Registration deadline ─────────────────────────────────────────────────
    const doorTimeMeta = $('[itemprop="doorTime"]').first();
    if (doorTimeMeta.length) {
      const raw =
        doorTimeMeta.attr("content") ??
        doorTimeMeta.attr("datetime") ??
        doorTimeMeta.text().trim();
      if (raw) {
        const iso = toIsoDateString(raw);
        if (iso) result.registrationDeadline = iso;
      }
    }

    if (!result.registrationDeadline) {
      const closePattern = /registration\s+(?:closes?|ends?|deadline)/i;
      const datePattern = /(\d{4}-\d{2}-\d{2}|\w+ \d{1,2},? \d{4})/;
      $("*").each((_i, el) => {
        if (result.registrationDeadline) return false;
        const node = $(el);
        if (node.children("*").length > 2) return;
        const text = node.text();
        if (!closePattern.test(text)) return;
        const match = text.match(datePattern);
        if (match) {
          const iso = toIsoDateString(match[1]);
          if (iso) result.registrationDeadline = iso;
        }
      });
    }

    // ── Entry fee ─────────────────────────────────────────────────────────────
    const priceMeta =
      $('[itemprop="price"]').first().attr("content") ??
      $('meta[itemprop="lowPrice"]').attr("content");
    if (priceMeta) {
      const amount = parseFloat(priceMeta.replace(/,/g, ""));
      if (!isNaN(amount) && amount > 0) result.entryFee = amount;
    }

    if (result.entryFee === undefined) {
      const feeText = $('[class*="fee"], [class*="price"], [class*="cost"]')
        .first()
        .text()
        .trim();
      if (feeText) {
        const match = feeText.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
        if (match) {
          result.entryFee = parseFloat(match[1].replace(/,/g, ""));
        }
      }
    }

    // ── Registration URL ──────────────────────────────────────────────────────
    result.registrationUrl = url;

    return result;
  } catch {
    return null;
  }
}
