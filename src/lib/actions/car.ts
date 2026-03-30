"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Car } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createCarSchema, updateCarSchema } from "@/lib/validations/car";

export type CarActionState = {
  data?: Car;
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

function parseOptionalDate(value: FormDataEntryValue | null): Date | undefined {
  if (value === null || value === "") return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

export async function createCar(
  _prevState: CarActionState,
  formData: FormData,
): Promise<CarActionState> {
  const userId = await requireAuth();

  const raw = {
    year: parseOptionalNumber(formData.get("year")),
    make: formData.get("make"),
    model: formData.get("model"),
    nickname: parseOptionalString(formData.get("nickname")),
    trim: parseOptionalString(formData.get("trim")),
    color: parseOptionalString(formData.get("color")),
    vin: parseOptionalString(formData.get("vin")),
    purchaseDate: parseOptionalDate(formData.get("purchaseDate")),
    purchasePrice: parseOptionalNumber(formData.get("purchasePrice")),
    currentOdometer: parseOptionalNumber(formData.get("currentOdometer")),
    primaryUse: parseOptionalString(formData.get("primaryUse")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createCarSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const car = await prisma.car.create({
    data: {
      userId,
      ...parsed.data,
    },
  });

  revalidatePath("/garage");
  redirect(`/garage/${car.id}`);
}

export async function updateCar(
  _prevState: CarActionState,
  formData: FormData,
): Promise<CarActionState> {
  const userId = await requireAuth();

  const carId = formData.get("carId");
  if (!carId || typeof carId !== "string") {
    return { error: "Car ID is required" };
  }

  const existing = await prisma.car.findUnique({ where: { id: carId } });
  if (!existing || existing.userId !== userId) {
    return { error: "Car not found" };
  }

  const raw = {
    year: parseOptionalNumber(formData.get("year")),
    make: parseOptionalString(formData.get("make")),
    model: parseOptionalString(formData.get("model")),
    nickname: parseOptionalString(formData.get("nickname")),
    trim: parseOptionalString(formData.get("trim")),
    color: parseOptionalString(formData.get("color")),
    vin: parseOptionalString(formData.get("vin")),
    purchaseDate: parseOptionalDate(formData.get("purchaseDate")),
    purchasePrice: parseOptionalNumber(formData.get("purchasePrice")),
    currentOdometer: parseOptionalNumber(formData.get("currentOdometer")),
    primaryUse: parseOptionalString(formData.get("primaryUse")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = updateCarSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const car = await prisma.car.update({
    where: { id: carId, userId },
    data: parsed.data,
  });

  revalidatePath("/garage");
  revalidatePath(`/garage/${carId}`);
  redirect(`/garage/${car.id}`);
}

export async function deleteCar(
  _prevState: CarActionState,
  formData: FormData,
): Promise<CarActionState> {
  const userId = await requireAuth();

  const carId = formData.get("carId");
  if (!carId || typeof carId !== "string") {
    return { error: "Car ID is required" };
  }

  const existing = await prisma.car.findUnique({ where: { id: carId } });
  if (!existing || existing.userId !== userId) {
    return { error: "Car not found" };
  }

  await prisma.car.delete({ where: { id: carId, userId } });

  revalidatePath("/garage");
  redirect("/garage");
}
