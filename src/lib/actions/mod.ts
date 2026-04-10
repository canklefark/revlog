"use server";

import { revalidatePath } from "next/cache";
import type { Mod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createModSchema, updateModSchema } from "@/lib/validations/mod";

export type ModActionState = {
  data?: Mod | true;
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

export async function createMod(
  _prevState: ModActionState,
  formData: FormData,
): Promise<ModActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    brand: parseOptionalString(formData.get("brand")),
    partNumber: parseOptionalString(formData.get("partNumber")),
    installDate: parseOptionalString(formData.get("installDate")),
    installedBy: parseOptionalString(formData.get("installedBy")),
    shopName: parseOptionalString(formData.get("shopName")),
    cost: parseOptionalNumber(formData.get("cost")),
    odometerAtInstall: parseOptionalNumber(formData.get("odometerAtInstall")),
    notes: parseOptionalString(formData.get("notes")),
    receiptUrl: parseOptionalString(formData.get("receiptUrl")),
  };

  const parsed = createModSchema.safeParse(raw);
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

  const installDateValue = parsed.data.installDate
    ? new Date(parsed.data.installDate)
    : undefined;

  const mod = await prisma.mod.create({
    data: {
      carId: parsed.data.carId,
      name: parsed.data.name,
      category: parsed.data.category,
      brand: parsed.data.brand,
      partNumber: parsed.data.partNumber,
      installDate: installDateValue,
      installedBy: parsed.data.installedBy,
      shopName: parsed.data.shopName,
      cost: parsed.data.cost,
      odometerAtInstall: parsed.data.odometerAtInstall,
      notes: parsed.data.notes,
      receiptUrl: parsed.data.receiptUrl,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/mods`);
  return { data: mod };
}

export async function updateMod(
  _prevState: ModActionState,
  formData: FormData,
): Promise<ModActionState> {
  const userId = await requireAuth();

  const raw = {
    modId: formData.get("modId") as string,
    name: parseOptionalString(formData.get("name")),
    category: parseOptionalString(formData.get("category")),
    brand: parseOptionalString(formData.get("brand")),
    partNumber: parseOptionalString(formData.get("partNumber")),
    installDate: parseOptionalString(formData.get("installDate")),
    installedBy: parseOptionalString(formData.get("installedBy")),
    shopName: parseOptionalString(formData.get("shopName")),
    cost: parseOptionalNumber(formData.get("cost")),
    odometerAtInstall: parseOptionalNumber(formData.get("odometerAtInstall")),
    notes: parseOptionalString(formData.get("notes")),
    receiptUrl: parseOptionalString(formData.get("receiptUrl")),
  };

  const parsed = updateModSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.mod.findUnique({
    where: { id: parsed.data.modId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  const installDateValue = parsed.data.installDate
    ? new Date(parsed.data.installDate)
    : undefined;

  const mod = await prisma.mod.update({
    where: { id: parsed.data.modId, car: { userId } },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
      ...(parsed.data.brand !== undefined && { brand: parsed.data.brand }),
      ...(parsed.data.partNumber !== undefined && {
        partNumber: parsed.data.partNumber,
      }),
      ...(installDateValue !== undefined && { installDate: installDateValue }),
      ...(parsed.data.installedBy !== undefined && {
        installedBy: parsed.data.installedBy,
      }),
      ...(parsed.data.shopName !== undefined && {
        shopName: parsed.data.shopName,
      }),
      ...(parsed.data.cost !== undefined && { cost: parsed.data.cost }),
      ...(parsed.data.odometerAtInstall !== undefined && {
        odometerAtInstall: parsed.data.odometerAtInstall,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.receiptUrl !== undefined && {
        receiptUrl: parsed.data.receiptUrl,
      }),
    },
  });

  revalidatePath(`/garage/${existing.car.id}/mods`);
  return { data: mod };
}

export async function deleteMod(
  _prevState: ModActionState,
  formData: FormData,
): Promise<ModActionState> {
  const userId = await requireAuth();

  const modId = formData.get("modId");
  if (!modId || typeof modId !== "string") {
    return { error: "Mod ID is required" };
  }

  const existing = await prisma.mod.findUnique({
    where: { id: modId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.mod.delete({
    where: { id: modId, car: { userId } },
  });

  revalidatePath(`/garage/${existing.car.id}/mods`);
  return { data: true };
}
