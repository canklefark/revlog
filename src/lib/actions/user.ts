"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { updateProfileSchema } from "@/lib/validations/user";
import { geocodeAddress } from "@/lib/services/geocode";
import { calculateDistance } from "@/lib/services/distance";

export type UpdateProfileState = {
  data?: {
    id: string;
    name: string | null;
    email: string | null;
    homeAddress: string | null;
    timezone: string;
    units: string;
    seasonBudget: number | null;
    defaultEventType: string | null;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const userId = await requireAuth();

  const raw = {
    name: formData.get("name"),
    homeAddress: formData.get("homeAddress") || undefined,
    timezone: formData.get("timezone") || undefined,
    units: formData.get("units") || undefined,
    seasonBudget: formData.get("seasonBudget")
      ? Number(formData.get("seasonBudget"))
      : undefined,
    defaultEventType: (() => {
      const v = formData.get("defaultEventType");
      return v && v !== "none" ? v : undefined;
    })(),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { name, homeAddress, timezone, units, seasonBudget, defaultEventType } =
    parsed.data;

  // Geocode the home address when one is provided.
  let homeLat: number | null = null;
  let homeLng: number | null = null;

  if (homeAddress) {
    const coords = await geocodeAddress(homeAddress);
    if (coords) {
      homeLat = coords.lat;
      homeLng = coords.lng;
    }
    // If geocoding returns null (no API key or error), we still save the
    // address — the lat/lng fields will remain null.
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        homeAddress: homeAddress ?? null,
        ...(timezone !== undefined && { timezone }),
        ...(units !== undefined && { units }),
        seasonBudget:
          seasonBudget === undefined || seasonBudget === ""
            ? null
            : seasonBudget,
        defaultEventType:
          defaultEventType === undefined || defaultEventType === ""
            ? null
            : defaultEventType,
        // Only overwrite lat/lng when a home address was submitted.
        // If homeAddress is undefined (field not included in form), leave existing coords alone.
        // If homeAddress is empty string (address cleared), wipe coords.
        ...(homeAddress !== undefined
          ? {
              homeLat: homeAddress ? homeLat : null,
              homeLng: homeAddress ? homeLng : null,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        homeAddress: true,
        timezone: true,
        units: true,
        seasonBudget: true,
        defaultEventType: true,
      },
    });

    // Backfill distances on existing events when home coords are now available.
    if (homeLat != null && homeLng != null) {
      const events = await prisma.event.findMany({
        where: { userId, address: { not: null } },
        select: { id: true, address: true, lat: true, lng: true },
      });
      await Promise.all(
        events.map(async (ev) => {
          // Geocode first if we don't have coords for this event yet.
          let evLat = ev.lat;
          let evLng = ev.lng;
          if ((evLat == null || evLng == null) && ev.address) {
            const coords = await geocodeAddress(ev.address);
            if (coords) {
              evLat = coords.lat;
              evLng = coords.lng;
            }
          }
          if (evLat == null || evLng == null) return;

          const result = await calculateDistance(
            { lat: homeLat!, lng: homeLng! },
            { lat: evLat, lng: evLng },
          );
          if (result) {
            await prisma.event.update({
              where: { id: ev.id, userId },
              data: {
                lat: evLat,
                lng: evLng,
                distanceFromHome: result.distanceMiles,
                driveTimeMinutes: result.driveTimeMinutes,
              },
            });
          }
        }),
      );
    }

    return { data: user };
  } catch {
    return { error: "Failed to update profile. Please try again." };
  }
}

export type CalendarSettingsState = {
  data?: { updated: true };
  error?: string;
};

export async function updateCalendarSettings(
  _prevState: CalendarSettingsState,
  formData: FormData,
): Promise<CalendarSettingsState> {
  const userId = await requireAuth();

  const calendarProvider = formData.get("calendarProvider");
  const calendarId = formData.get("calendarId");
  const calendarSyncEnabled = formData.get("calendarSyncEnabled");

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        calendarProvider:
          typeof calendarProvider === "string" ? calendarProvider : null,
        calendarId:
          typeof calendarId === "string" && calendarId.length > 0
            ? calendarId
            : null,
        calendarSyncEnabled: calendarSyncEnabled === "true",
      },
    });

    return { data: { updated: true } };
  } catch {
    return { error: "Failed to update calendar settings. Please try again." };
  }
}
