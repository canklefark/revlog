// Server-only — never import this from client components.
// Best-effort generic scraper: partial results are acceptable. Never throws.

import * as cheerio from "cheerio";
import type { ScrapedEventData } from "./motorsportreg-scraper";

type CheerioRoot = ReturnType<typeof cheerio.load>;

function toIsoDateString(raw: string): string | undefined {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

interface JsonLdEvent {
  "@type"?: string | string[];
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: {
    name?: string;
    address?:
      | string
      | {
          streetAddress?: string;
          addressLocality?: string;
          addressRegion?: string;
        };
  };
  organizer?: {
    name?: string;
  };
}

function extractJsonLdEvent($: CheerioRoot): JsonLdEvent | undefined {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    const el = scripts.eq(i);
    const text = el.html();
    if (!text) continue;

    try {
      const parsed: unknown = JSON.parse(text);

      // Handle both single object and @graph array
      const candidates: unknown[] = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" &&
            parsed !== null &&
            "@graph" in parsed &&
            Array.isArray((parsed as Record<string, unknown>)["@graph"])
          ? ((parsed as Record<string, unknown>)["@graph"] as unknown[])
          : [parsed];

      for (const candidate of candidates) {
        if (typeof candidate !== "object" || candidate === null) continue;
        const obj = candidate as Record<string, unknown>;
        const type = obj["@type"];
        const isEvent =
          type === "Event" || (Array.isArray(type) && type.includes("Event"));
        if (isEvent) {
          return obj as unknown as JsonLdEvent;
        }
      }
    } catch {
      // Malformed JSON-LD — skip this script tag
    }
  }

  return undefined;
}

function extractAddressFromJsonLd(
  location: JsonLdEvent["location"],
): string | undefined {
  if (!location?.address) return undefined;

  if (typeof location.address === "string") {
    const trimmed = location.address.trim();
    return trimmed || undefined;
  }

  const parts: string[] = [];
  if (location.address.streetAddress)
    parts.push(location.address.streetAddress);
  if (location.address.addressLocality)
    parts.push(location.address.addressLocality);
  if (location.address.addressRegion)
    parts.push(location.address.addressRegion);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function parseGenericEventHtml(
  html: string,
  sourceUrl: string,
): Partial<ScrapedEventData> {
  try {
    const $ = cheerio.load(html);
    const result: Partial<ScrapedEventData> = {};
    const jsonLd = extractJsonLdEvent($);

    // ── Event name ──────────────────────────────────────────────────────────
    if (jsonLd?.name?.trim()) {
      result.name = jsonLd.name.trim();
    } else {
      const og = $('meta[property="og:title"]').attr("content")?.trim();
      if (og) {
        result.name = og;
      } else {
        const title = $("title").text().trim();
        if (title) {
          // Strip site name suffix: "Event Name | Site" or "Event Name - Site"
          const stripped = title.split(/\s+[|\-]\s+/)[0].trim();
          if (stripped) result.name = stripped;
        }
      }
    }

    // ── Start date ───────────────────────────────────────────────────────────
    if (jsonLd?.startDate) {
      const iso = toIsoDateString(jsonLd.startDate);
      if (iso) result.startDate = iso;
    }

    if (!result.startDate) {
      const startMeta = $('[itemprop="startDate"]').first();
      if (startMeta.length) {
        const raw =
          startMeta.attr("content") ??
          startMeta.attr("datetime") ??
          startMeta.text().trim();
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.startDate = iso;
        }
      }
    }

    if (!result.startDate) {
      const ogStart = $('meta[property="event:start_time"]').attr("content");
      if (ogStart) {
        const iso = toIsoDateString(ogStart);
        if (iso) result.startDate = iso;
      }
    }

    // ── End date ─────────────────────────────────────────────────────────────
    if (jsonLd?.endDate) {
      const iso = toIsoDateString(jsonLd.endDate);
      if (iso) result.endDate = iso;
    }

    if (!result.endDate) {
      const endMeta = $('[itemprop="endDate"]').first();
      if (endMeta.length) {
        const raw =
          endMeta.attr("content") ??
          endMeta.attr("datetime") ??
          endMeta.text().trim();
        if (raw) {
          const iso = toIsoDateString(raw);
          if (iso) result.endDate = iso;
        }
      }
    }

    // ── Venue name ───────────────────────────────────────────────────────────
    if (jsonLd?.location?.name?.trim()) {
      result.venueName = jsonLd.location.name.trim();
    } else {
      const venueMeta = $('[itemprop="location"]').first().text().trim();
      if (venueMeta) result.venueName = venueMeta;
    }

    // ── Address ──────────────────────────────────────────────────────────────
    const jsonLdAddress = extractAddressFromJsonLd(jsonLd?.location);
    if (jsonLdAddress) {
      result.address = jsonLdAddress;
    } else {
      const streetMeta = $('[itemprop="streetAddress"]').first().text().trim();
      if (streetMeta) result.address = streetMeta;
    }

    // ── Organizing body ──────────────────────────────────────────────────────
    if (jsonLd?.organizer?.name?.trim()) {
      result.organizingBody = jsonLd.organizer.name.trim();
    } else {
      const siteName = $('meta[property="og:site_name"]')
        .attr("content")
        ?.trim();
      if (siteName) result.organizingBody = siteName;
    }

    // ── Notes / description ──────────────────────────────────────────────────
    // ScrapedEventData has no "notes" field — closest match is not in the type,
    // so skip. (description would map to nothing without extending the type.)

    // ── Registration URL ─────────────────────────────────────────────────────
    result.registrationUrl = sourceUrl;

    // ── Entry fee ────────────────────────────────────────────────────────────
    const feeKeywords = /fee|entry|price|cost|register/i;
    const feePattern = /\$([\d,]+(?:\.\d{2})?)/;

    $("*").each((_i, el) => {
      if (result.entryFee !== undefined) return false; // stop iteration

      const node = $(el);
      // Only inspect leaf-ish text nodes to avoid overly broad matches
      if (node.children("*").length > 3) return;

      const text = node.text();
      if (!feeKeywords.test(text)) return;

      const match = text.match(feePattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ""));
        if (amount > 0 && amount < 10000) {
          result.entryFee = amount;
        }
      }
    });

    return result;
  } catch {
    return {};
  }
}

export async function fetchAndParseGenericUrl(
  url: string,
): Promise<Partial<ScrapedEventData> | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RevLog/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const result = parseGenericEventHtml(html, url);

    // Return null when nothing was parsed (only registrationUrl is always set)
    const keys = Object.keys(result).filter((k) => k !== "registrationUrl");
    if (keys.length === 0) return null;

    return result;
  } catch {
    return null;
  }
}
