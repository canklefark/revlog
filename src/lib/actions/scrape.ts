"use server";

import { requireAuth } from "@/lib/auth-utils";
import {
  scrapeMotorsportReg,
  type ScrapedEventData,
} from "@/lib/services/motorsportreg-scraper";

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
  try {
    new URL(url);
  } catch {
    return { error: "Invalid URL format" };
  }

  const data = await scrapeMotorsportReg(url.trim());

  if (!data) {
    return {
      error:
        "Could not parse event details from that URL. Only motorsportreg.com URLs are supported.",
    };
  }

  if (Object.keys(data).length === 0) {
    return { error: "No event details found at that URL." };
  }

  return { data };
}
