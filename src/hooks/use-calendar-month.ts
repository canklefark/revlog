"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { parse, format, isValid } from "date-fns";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = "calendar-last-viewed";
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function getLastViewed(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const ts = parseInt(raw, 10);
    return isNaN(ts) ? null : ts;
  } catch {
    return null;
  }
}

function touchLastViewed() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function useCalendarMonth(): {
  currentMonth: Date;
  setMonth: (date: Date) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthParam = searchParams.get("month");
  const validMonthParam =
    monthParam && MONTH_REGEX.test(monthParam) ? monthParam : null;
  const parsed = validMonthParam
    ? parse(validMonthParam, "yyyy-MM", new Date())
    : null;
  const currentMonth = parsed && isValid(parsed) ? parsed : new Date();

  // On mount: check staleness and reset if idle too long.
  // Always stamp the timestamp so returning users reset the clock.
  useEffect(() => {
    const lastViewed = getLastViewed();
    if (
      lastViewed !== null &&
      Date.now() - lastViewed > INACTIVITY_TIMEOUT_MS &&
      validMonthParam
    ) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("month");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    // Stamp on every calendar mount whether or not we reset
    touchLastViewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentional empty deps: this is a mount-only check

  function setMonth(date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(date, "yyyy-MM"));
    router.replace(`${pathname}?${params.toString()}`);
    touchLastViewed();
  }

  return { currentMonth, setMonth };
}
