"use server";

import { requireAuth } from "@/lib/auth-utils";
import {
  scrapeMotorsportReg,
  type ScrapedEventData,
} from "@/lib/services/motorsportreg-scraper";
import { fetchAndParseGenericUrl } from "@/lib/services/generic-event-scraper";

export type ScrapeActionState = {
  data?: Partial<ScrapedEventData>;
  error?: string;
};

export async function scrapeEventUrl(
  _prevState: ScrapeActionState,
  formData: FormData,
): Promise<ScrapeActionState> {
  await requireAuth();

  const url = formData.get("url");
  if (!url || typeof url !== "string" || url.trim() === "") {
    return { error: "URL is required" };
  }

  // Validate URL format before hitting the network.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: "Invalid URL format" };
  }

  // 1. MotorsportReg-specific scraper (hostname-gated).
  if (parsedUrl.hostname.includes("motorsportreg.com")) {
    const data = await scrapeMotorsportReg(url.trim());
    if (data && Object.keys(data).length > 0) return { data };
  }

  // 2. Generic scraper for any event URL.
  const genericData = await fetchAndParseGenericUrl(url.trim());
  if (genericData && Object.keys(genericData).length > 0) {
    return { data: genericData };
  }

  return { error: "Could not parse event details from that URL." };
}
