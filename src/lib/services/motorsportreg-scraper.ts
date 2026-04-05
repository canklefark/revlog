// Server-only — never import this from client components.
// Best-effort scraper: partial results are acceptable. Never throws.

import * as cheerio from "cheerio";

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

    // Event name — h1 first, fall back to <title> left of the pipe.
    const h1 = $("h1").first().text().trim();
    if (h1) {
      result.name = h1;
    } else {
      const title = $("title").text().trim().split("|")[0].trim();
      if (title) result.name = title;
    }

    // Organization / club name.
    const org = $('[class*="organiz"], [class*="club"], [itemprop="organizer"]')
      .first()
      .text()
      .trim();
    if (org) result.organizingBody = org;

    // Dates + times — prefer schema.org itemprop attributes, then generic datetime attrs.
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

    // Registration deadline — schema.org doorTime or registration close text.
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
      // Look for text near "registration closes/ends/deadline"
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

    // Venue name.
    const venue = $(
      '[itemprop="location"] [itemprop="name"], [itemprop="location"]',
    )
      .first()
      .text()
      .trim();
    if (venue) result.venueName = venue;

    // Address.
    const address = $('[itemprop="address"]').first().text().trim();
    if (address) result.address = address;

    // Entry fee — schema.org price first, then dollar amounts near fee keywords.
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

    // Registration URL is the canonical source URL.
    result.registrationUrl = url;

    return result;
  } catch {
    return null;
  }
}
