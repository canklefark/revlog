"use server";

import { revalidatePath } from "next/cache";
import type { BrakeSet } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createBrakeSetSchema,
  updateBrakeSetSchema,
} from "@/lib/validations/brake-set";

export type BrakeSetActionState = {
  data?: BrakeSet | true;
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

export async function createBrakeSet(
  _prevState: BrakeSetActionState,
  formData: FormData,
): Promise<BrakeSetActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    position: formData.get("position") as string,
    padBrand: parseOptionalString(formData.get("padBrand")),
    padCompound: parseOptionalString(formData.get("padCompound")),
    rotorBrand: parseOptionalString(formData.get("rotorBrand")),
    rotorNotes: parseOptionalString(formData.get("rotorNotes")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    cost: parseOptionalNumber(formData.get("cost")),
    wearRemaining: parseOptionalNumber(formData.get("wearRemaining")),
    status: parseOptionalString(formData.get("status")) ?? "Active",
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createBrakeSetSchema.safeParse(raw);
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

  const purchaseDateValue = parsed.data.purchaseDate
    ? new Date(parsed.data.purchaseDate)
    : undefined;

  const brakeSet = await prisma.brakeSet.create({
    data: {
      carId: parsed.data.carId,
      position: parsed.data.position,
      padBrand: parsed.data.padBrand,
      padCompound: parsed.data.padCompound,
      rotorBrand: parsed.data.rotorBrand,
      rotorNotes: parsed.data.rotorNotes,
      purchaseDate: purchaseDateValue,
      cost: parsed.data.cost,
      wearRemaining: parsed.data.wearRemaining,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/brakes`);
  return { data: brakeSet };
}

export async function updateBrakeSet(
  _prevState: BrakeSetActionState,
  formData: FormData,
): Promise<BrakeSetActionState> {
  const userId = await requireAuth();

  const raw = {
    brakeSetId: formData.get("brakeSetId") as string,
    position: parseOptionalString(formData.get("position")),
    padBrand: parseOptionalString(formData.get("padBrand")),
    padCompound: parseOptionalString(formData.get("padCompound")),
    rotorBrand: parseOptionalString(formData.get("rotorBrand")),
    rotorNotes: parseOptionalString(formData.get("rotorNotes")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    cost: parseOptionalNumber(formData.get("cost")),
    wearRemaining: parseOptionalNumber(formData.get("wearRemaining")),
    status: parseOptionalString(formData.get("status")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = updateBrakeSetSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.brakeSet.findFirst({
    where: { id: parsed.data.brakeSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const purchaseDateValue = parsed.data.purchaseDate
    ? new Date(parsed.data.purchaseDate)
    : undefined;

  const brakeSet = await prisma.brakeSet.update({
    where: { id: parsed.data.brakeSetId, car: { userId } },
    data: {
      ...(parsed.data.position !== undefined && {
        position: parsed.data.position,
      }),
      ...(parsed.data.padBrand !== undefined && {
        padBrand: parsed.data.padBrand,
      }),
      ...(parsed.data.padCompound !== undefined && {
        padCompound: parsed.data.padCompound,
      }),
      ...(parsed.data.rotorBrand !== undefined && {
        rotorBrand: parsed.data.rotorBrand,
      }),
      ...(parsed.data.rotorNotes !== undefined && {
        rotorNotes: parsed.data.rotorNotes,
      }),
      ...(purchaseDateValue !== undefined && {
        purchaseDate: purchaseDateValue,
      }),
      ...(parsed.data.cost !== undefined && { cost: parsed.data.cost }),
      ...(parsed.data.wearRemaining !== undefined && {
        wearRemaining: parsed.data.wearRemaining,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  revalidatePath(`/garage/${existing.car.id}/brakes`);
  return { data: brakeSet };
}

export async function deleteBrakeSet(
  _prevState: BrakeSetActionState,
  formData: FormData,
): Promise<BrakeSetActionState> {
  const userId = await requireAuth();

  const brakeSetId = formData.get("brakeSetId");
  if (!brakeSetId || typeof brakeSetId !== "string") {
    return { error: "Brake set ID is required" };
  }

  const existing = await prisma.brakeSet.findFirst({
    where: { id: brakeSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  await prisma.brakeSet.delete({
    where: { id: brakeSetId, car: { userId } },
  });

  revalidatePath(`/garage/${existing.car.id}/brakes`);
  return { data: true };
}

export async function incrementBrakeHeatCycles(
  _prevState: BrakeSetActionState,
  formData: FormData,
): Promise<BrakeSetActionState> {
  const userId = await requireAuth();

  const brakeSetId = formData.get("brakeSetId");
  if (!brakeSetId || typeof brakeSetId !== "string") {
    return { error: "Brake set ID is required" };
  }

  const existing = await prisma.brakeSet.findFirst({
    where: { id: brakeSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const brakeSet = await prisma.brakeSet.update({
    where: { id: brakeSetId, car: { userId } },
    data: { heatCycles: { increment: 1 } },
  });

  revalidatePath(`/garage/${existing.car.id}/brakes/${brakeSetId}`);
  return { data: brakeSet };
}
