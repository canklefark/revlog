"use server";

import { revalidatePath } from "next/cache";
import type { Part } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createPartSchema, updatePartSchema } from "@/lib/validations/part";
import { PART_STATUSES } from "@/lib/constants/part-statuses";

export type PartActionState = {
  data?: Part | true;
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

export async function createPart(
  _prevState: PartActionState,
  formData: FormData,
): Promise<PartActionState> {
  const userId = await requireAuth();

  const raw = {
    name: formData.get("name") as string,
    manufacturer: parseOptionalString(formData.get("manufacturer")),
    partNumber: parseOptionalString(formData.get("partNumber")),
    category: parseOptionalString(formData.get("category")),
    description: parseOptionalString(formData.get("description")),
    productLink: parseOptionalString(formData.get("productLink")),
    status: (formData.get("status") as string) || "stock",
    carId: parseOptionalString(formData.get("carId")),
    price: parseOptionalNumber(formData.get("price")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    vendor: parseOptionalString(formData.get("vendor")),
    quantity: parseOptionalNumber(formData.get("quantity")) ?? 1,
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createPartSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  // Verify carId ownership if provided
  if (parsed.data.carId) {
    const car = await prisma.car.findUnique({
      where: { id: parsed.data.carId },
    });
    if (!car || car.userId !== userId) {
      return { error: "Car not found" };
    }
  }

  const part = await prisma.part.create({
    data: {
      userId,
      name: parsed.data.name,
      manufacturer: parsed.data.manufacturer,
      partNumber: parsed.data.partNumber,
      category: parsed.data.category,
      description: parsed.data.description,
      productLink: parsed.data.productLink,
      status: parsed.data.status,
      carId: parsed.data.carId,
      price: parsed.data.price,
      purchaseDate: parsed.data.purchaseDate
        ? new Date(parsed.data.purchaseDate)
        : undefined,
      vendor: parsed.data.vendor,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${part.carId ?? ""}/parts`);
  return { data: part };
}

export async function updatePart(
  _prevState: PartActionState,
  formData: FormData,
): Promise<PartActionState> {
  const userId = await requireAuth();

  const raw = {
    partId: formData.get("partId") as string,
    name: parseOptionalString(formData.get("name")),
    manufacturer: parseOptionalString(formData.get("manufacturer")),
    partNumber: parseOptionalString(formData.get("partNumber")),
    category: parseOptionalString(formData.get("category")),
    description: parseOptionalString(formData.get("description")),
    productLink: parseOptionalString(formData.get("productLink")),
    status: parseOptionalString(formData.get("status")),
    carId: parseOptionalString(formData.get("carId")),
    price: parseOptionalNumber(formData.get("price")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    vendor: parseOptionalString(formData.get("vendor")),
    quantity: parseOptionalNumber(formData.get("quantity")),
    notes: parseOptionalString(formData.get("notes")),
    installedAt: parseOptionalString(formData.get("installedAt")),
  };

  const parsed = updatePartSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.part.findUnique({
    where: { id: parsed.data.partId, userId },
  });
  if (!existing) return { error: "Not found" };

  if (parsed.data.carId) {
    const car = await prisma.car.findUnique({
      where: { id: parsed.data.carId },
    });
    if (!car || car.userId !== userId) return { error: "Car not found" };
  }

  const part = await prisma.part.update({
    where: { id: parsed.data.partId, userId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.manufacturer !== undefined && {
        manufacturer: parsed.data.manufacturer,
      }),
      ...(parsed.data.partNumber !== undefined && {
        partNumber: parsed.data.partNumber,
      }),
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.productLink !== undefined && {
        productLink: parsed.data.productLink,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.carId !== undefined && { carId: parsed.data.carId }),
      ...(parsed.data.price !== undefined && { price: parsed.data.price }),
      ...(parsed.data.purchaseDate !== undefined && {
        purchaseDate: new Date(parsed.data.purchaseDate),
      }),
      ...(parsed.data.vendor !== undefined && { vendor: parsed.data.vendor }),
      ...(parsed.data.quantity !== undefined && {
        quantity: parsed.data.quantity,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.installedAt !== undefined && {
        installedAt: new Date(parsed.data.installedAt),
      }),
    },
  });

  revalidatePath(`/garage/${part.carId ?? ""}/parts`);
  return { data: part };
}

export async function updatePartStatus(
  _prevState: PartActionState,
  formData: FormData,
): Promise<PartActionState> {
  const userId = await requireAuth();

  const partId = formData.get("partId") as string;
  const status = formData.get("status") as string;

  if (!partId) return { error: "Part ID is required" };
  if (!PART_STATUSES.includes(status as (typeof PART_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const existing = await prisma.part.findUnique({
    where: { id: partId, userId },
  });
  if (!existing) return { error: "Not found" };

  const part = await prisma.part.update({
    where: { id: partId, userId },
    data: {
      status,
      installedAt:
        status === "installed"
          ? (existing.installedAt ?? new Date())
          : status !== "installed"
            ? null
            : undefined,
    },
  });

  revalidatePath(`/garage/${part.carId ?? ""}/parts`);
  return { data: part };
}

export async function deletePart(
  _prevState: PartActionState,
  formData: FormData,
): Promise<PartActionState> {
  const userId = await requireAuth();

  const partId = formData.get("partId");
  if (!partId || typeof partId !== "string") {
    return { error: "Part ID is required" };
  }

  const existing = await prisma.part.findUnique({
    where: { id: partId, userId },
  });
  if (!existing) return { error: "Not found" };

  await prisma.part.delete({ where: { id: partId, userId } });

  revalidatePath(`/garage/${existing.carId ?? ""}/parts`);
  return { data: true };
}
