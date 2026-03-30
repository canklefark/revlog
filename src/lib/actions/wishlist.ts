"use server";

import { revalidatePath } from "next/cache";
import type { WishlistItem, Mod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createWishlistSchema,
  updateWishlistSchema,
} from "@/lib/validations/wishlist";

export type WishlistActionState = {
  data?: WishlistItem | Mod | true;
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

export async function createWishlistItem(
  _prevState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    name: formData.get("name") as string,
    category: parseOptionalString(formData.get("category")),
    estimatedCost: parseOptionalNumber(formData.get("estimatedCost")),
    priority: (formData.get("priority") as string) || "Medium",
    sourceUrl: parseOptionalString(formData.get("sourceUrl")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createWishlistSchema.safeParse(raw);
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

  const item = await prisma.wishlistItem.create({
    data: {
      carId: parsed.data.carId,
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      estimatedCost: parsed.data.estimatedCost,
      priority: parsed.data.priority,
      sourceUrl: parsed.data.sourceUrl || null,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/wishlist`);
  return { data: item };
}

export async function updateWishlistItem(
  _prevState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const userId = await requireAuth();

  const raw = {
    itemId: formData.get("itemId") as string,
    name: parseOptionalString(formData.get("name")),
    category: parseOptionalString(formData.get("category")),
    estimatedCost: parseOptionalNumber(formData.get("estimatedCost")),
    priority: parseOptionalString(formData.get("priority")),
    sourceUrl: parseOptionalString(formData.get("sourceUrl")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = updateWishlistSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  const item = await prisma.wishlistItem.update({
    where: { id: parsed.data.itemId, car: { userId } },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
      ...(parsed.data.estimatedCost !== undefined && {
        estimatedCost: parsed.data.estimatedCost,
      }),
      ...(parsed.data.priority !== undefined && {
        priority: parsed.data.priority,
      }),
      ...(parsed.data.sourceUrl !== undefined && {
        sourceUrl: parsed.data.sourceUrl || null,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  revalidatePath(`/garage/${existing.car.id}/wishlist`);
  return { data: item };
}

export async function deleteWishlistItem(
  _prevState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const userId = await requireAuth();

  const itemId = formData.get("itemId");
  if (!itemId || typeof itemId !== "string") {
    return { error: "Item ID is required" };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.wishlistItem.delete({
    where: { id: itemId, car: { userId } },
  });

  revalidatePath(`/garage/${existing.car.id}/wishlist`);
  return { data: true };
}

export async function moveWishlistToMod(
  _prevState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const userId = await requireAuth();

  const itemId = formData.get("itemId");
  if (!itemId || typeof itemId !== "string") {
    return { error: "Item ID is required" };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { car: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.car.userId !== userId) {
    return { error: "Not found" };
  }

  const carId = existing.car.id;

  const [mod] = await prisma.$transaction([
    prisma.mod.create({
      data: {
        carId: existing.carId,
        name: existing.name,
        category: existing.category ?? "Other",
        cost: existing.estimatedCost ?? undefined,
        notes: existing.notes ?? undefined,
      },
    }),
    prisma.wishlistItem.delete({
      where: { id: itemId },
    }),
  ]);

  revalidatePath(`/garage/${carId}/wishlist`);
  revalidatePath(`/garage/${carId}/mods`);
  return { data: mod };
}
