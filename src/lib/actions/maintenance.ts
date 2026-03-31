"use server";

import { revalidatePath } from "next/cache";
import type { MaintenanceEntry } from "@prisma/client";
import { addWeeks, addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "@/lib/validations/maintenance";
import {
  snoozeMaintenanceSchema,
  unsnoozeMaintenanceSchema,
} from "@/lib/validations/maintenance-snooze";

export type MaintenanceActionState = {
  data?: MaintenanceEntry | true;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseOptionalNumber(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

export async function createMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    serviceType: formData.get("serviceType") as string,
    customServiceName: parseOptionalString(formData.get("customServiceName")),
    date: formData.get("date") as string,
    odometer: parseOptionalNumber(formData.get("odometer")),
    performedBy: parseOptionalString(formData.get("performedBy")),
    shopName: parseOptionalString(formData.get("shopName")),
    productBrand: parseOptionalString(formData.get("productBrand")),
    productSpec: parseOptionalString(formData.get("productSpec")),
    cost: parseOptionalNumber(formData.get("cost")),
    notes: parseOptionalString(formData.get("notes")),
    nextDueDate: parseOptionalString(formData.get("nextDueDate")),
    nextDueMileage: parseOptionalNumber(formData.get("nextDueMileage")),
  };

  const parsed = createMaintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const car = await prisma.car.findUnique({
    where: { id: parsed.data.carId },
  });

  if (!car || car.userId !== userId) {
    return { error: "Not found" };
  }

  const dateValue = new Date(parsed.data.date);
  const nextDueDateValue = parsed.data.nextDueDate
    ? new Date(parsed.data.nextDueDate)
    : undefined;

  const entry = await prisma.maintenanceEntry.create({
    data: {
      carId: parsed.data.carId,
      serviceType: parsed.data.serviceType,
      customServiceName: parsed.data.customServiceName,
      date: dateValue,
      odometer: parsed.data.odometer,
      performedBy: parsed.data.performedBy,
      shopName: parsed.data.shopName,
      productBrand: parsed.data.productBrand,
      productSpec: parsed.data.productSpec,
      cost: parsed.data.cost,
      notes: parsed.data.notes,
      nextDueDate: nextDueDateValue,
      nextDueMileage: parsed.data.nextDueMileage,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/maintenance`);
  return { data: entry };
}

export async function updateMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const userId = await requireAuth();

  const raw = {
    entryId: formData.get("entryId") as string,
    serviceType: parseOptionalString(formData.get("serviceType")),
    customServiceName: parseOptionalString(formData.get("customServiceName")),
    date: parseOptionalString(formData.get("date")),
    odometer: parseOptionalNumber(formData.get("odometer")),
    performedBy: parseOptionalString(formData.get("performedBy")),
    shopName: parseOptionalString(formData.get("shopName")),
    productBrand: parseOptionalString(formData.get("productBrand")),
    productSpec: parseOptionalString(formData.get("productSpec")),
    cost: parseOptionalNumber(formData.get("cost")),
    notes: parseOptionalString(formData.get("notes")),
    nextDueDate: parseOptionalString(formData.get("nextDueDate")),
    nextDueMileage: parseOptionalNumber(formData.get("nextDueMileage")),
  };

  const parsed = updateMaintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.maintenanceEntry.findUnique({
    where: { id: parsed.data.entryId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  const dateValue = parsed.data.date ? new Date(parsed.data.date) : undefined;
  const nextDueDateValue = parsed.data.nextDueDate
    ? new Date(parsed.data.nextDueDate)
    : undefined;

  // Scope the update through the car relation to make ownership atomic.
  const entry = await prisma.maintenanceEntry.update({
    where: { id: parsed.data.entryId, car: { userId } },
    data: {
      ...(parsed.data.serviceType !== undefined && {
        serviceType: parsed.data.serviceType,
      }),
      ...(parsed.data.customServiceName !== undefined && {
        customServiceName: parsed.data.customServiceName,
      }),
      ...(dateValue !== undefined && { date: dateValue }),
      ...(parsed.data.odometer !== undefined && {
        odometer: parsed.data.odometer,
      }),
      ...(parsed.data.performedBy !== undefined && {
        performedBy: parsed.data.performedBy,
      }),
      ...(parsed.data.shopName !== undefined && {
        shopName: parsed.data.shopName,
      }),
      ...(parsed.data.productBrand !== undefined && {
        productBrand: parsed.data.productBrand,
      }),
      ...(parsed.data.productSpec !== undefined && {
        productSpec: parsed.data.productSpec,
      }),
      ...(parsed.data.cost !== undefined && { cost: parsed.data.cost }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(nextDueDateValue !== undefined && { nextDueDate: nextDueDateValue }),
      ...(parsed.data.nextDueMileage !== undefined && {
        nextDueMileage: parsed.data.nextDueMileage,
      }),
    },
  });

  revalidatePath(`/garage/${existing.carId}/maintenance`);
  return { data: entry };
}

export async function deleteMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const userId = await requireAuth();

  const entryId = formData.get("entryId");
  if (!entryId || typeof entryId !== "string") {
    return { error: "Entry ID is required" };
  }

  const existing = await prisma.maintenanceEntry.findUnique({
    where: { id: entryId },
    include: { car: true },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.maintenanceEntry.delete({
    where: { id: entryId, car: { userId } },
  });

  revalidatePath(`/garage/${existing.carId}/maintenance`);
  return { data: true };
}

export async function snoozeMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const userId = await requireAuth();

  const raw = {
    entryId: formData.get("entryId") as string,
    duration: formData.get("duration") as string,
    customDate: formData.get("customDate") as string | undefined,
  };

  const parsed = snoozeMaintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0] ?? "Validation failed",
    };
  }

  const { entryId, duration, customDate } = parsed.data;

  const entry = await prisma.maintenanceEntry.findUnique({
    where: { id: entryId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!entry || entry.car.userId !== userId) {
    return { error: "Not found" };
  }

  let snoozedUntil: Date;

  if (duration === "1week") {
    snoozedUntil = addWeeks(new Date(), 1);
  } else if (duration === "2weeks") {
    snoozedUntil = addWeeks(new Date(), 2);
  } else if (duration === "1month") {
    snoozedUntil = addMonths(new Date(), 1);
  } else {
    // custom
    const parsed = new Date(customDate!);
    if (isNaN(parsed.getTime())) {
      return { error: "Invalid date" };
    }
    snoozedUntil = parsed;
  }

  await prisma.$transaction([
    prisma.maintenanceEntry.update({
      where: { id: entryId, car: { userId } },
      data: { snoozedUntil },
    }),
    prisma.maintenanceAudit.create({
      data: {
        maintenanceEntryId: entryId,
        action: "snoozed",
        previousSnoozedUntil: entry.snoozedUntil,
        newSnoozedUntil: snoozedUntil,
      },
    }),
  ]);

  revalidatePath(`/garage/${entry.car.id}/maintenance`);
  revalidatePath("/dashboard");
  return { data: true };
}

export async function unsnoozeMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const userId = await requireAuth();

  const raw = { entryId: formData.get("entryId") as string };

  const parsed = unsnoozeMaintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Entry ID is required" };
  }

  const { entryId } = parsed.data;

  const entry = await prisma.maintenanceEntry.findUnique({
    where: { id: entryId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!entry || entry.car.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.$transaction([
    prisma.maintenanceEntry.update({
      where: { id: entryId, car: { userId } },
      data: { snoozedUntil: null },
    }),
    prisma.maintenanceAudit.create({
      data: {
        maintenanceEntryId: entryId,
        action: "unsnoozed",
        previousSnoozedUntil: entry.snoozedUntil,
        newSnoozedUntil: null,
      },
    }),
  ]);

  revalidatePath(`/garage/${entry.car.id}/maintenance`);
  revalidatePath("/dashboard");
  return { data: true };
}
