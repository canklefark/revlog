// Server-only — never import this from client components.
// Best-effort scraper: partial results are acceptable. Never throws.

import * as cheerio from "cheerio";

export interface ScrapedEventData {
  name?: string;
  type?: string;
  organizingBody?: string;
  startDate?: string; // ISO date string "YYYY-MM-DD"
  endDate?: string; // ISO date string "YYYY-MM-DD"
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

    // Dates — prefer schema.org itemprop attributes, then generic datetime attrs.
    const startDateMeta = $('[itemprop="startDate"]').first();
    if (startDateMeta.length) {
      const raw =
        startDateMeta.attr("content") ??
        startDateMeta.attr("datetime") ??
        startDateMeta.text().trim();
      if (raw) {
        const iso = toIsoDateString(raw);
        if (iso) result.startDate = iso;
      }
    }

    if (!result.startDate) {
      const datetimeEl = $("[datetime]").first();
      if (datetimeEl.length) {
        const raw = datetimeEl.attr("datetime");
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.startDate = iso;
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
      }
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

    // Entry fee — extract dollar amount from fee/price/cost elements.
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

    // Registration URL is the canonical source URL.
    result.registrationUrl = url;

    return result;
  } catch {
    return null;
  }
}
