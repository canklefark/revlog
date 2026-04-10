"use server";

import { requireAuth } from "@/lib/auth-utils";
import { msrCredsPresent } from "@/lib/services/msr-oauth";
import {
  getMsrAccount,
  type MsrEventResult,
} from "@/lib/services/msr-authenticated-api";
import {
  searchMsrCalendars,
  type MsrSearchParams,
} from "@/lib/services/msr-search-api";

export type MsrSearchState = {
  data?: MsrEventResult[];
  error?: string;
};

const US_ZIP = /^\d{5}$/;
const CA_POSTAL = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const VALID_RADII = new Set([50, 100, 150, 200, 300, 500]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function searchMsrEvents(
  _prev: MsrSearchState,
  formData: FormData,
): Promise<MsrSearchState> {
  const userId = await requireAuth();

  if (!msrCredsPresent()) {
    return { error: "MSR integration not configured on this server." };
  }
  const account = await getMsrAccount(userId);
  if (!account) {
    return {
      error:
        "No MSR account connected. Connect MotorsportReg in Settings → Integrations.",
    };
  }

  const postalcode = (formData.get("postalcode") as string | null)?.trim();
  if (
    !postalcode ||
    (!US_ZIP.test(postalcode) && !CA_POSTAL.test(postalcode))
  ) {
    return {
      error:
        "Enter a valid US zip code (e.g. 90210) or Canadian postal code (e.g. M5V3A8).",
    };
  }

  const radiusRaw = Number(formData.get("radius") ?? 300);
  const radius = VALID_RADII.has(radiusRaw) ? radiusRaw : 300;

  const start = (formData.get("start") as string | null)?.trim();
  const end = (formData.get("end") as string | null)?.trim();

  const params: MsrSearchParams = {
    postalcode,
    radius,
    ...(start && DATE_PATTERN.test(start) ? { start } : {}),
    ...(end && DATE_PATTERN.test(end) ? { end } : {}),
  };

  const results = await searchMsrCalendars(userId, params, account);

  if (results.length === 0) {
    return {
      error:
        "No events found for that location. Try a larger radius or different date range.",
    };
  }

  return { data: results };
}
