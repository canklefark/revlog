"use server";

import { revalidatePath } from "next/cache";
import type { TireSet, TreadDepthLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createTireSetSchema,
  updateTireSetSchema,
  addTreadDepthSchema,
} from "@/lib/validations/tire-set";

export type TireSetActionState = {
  data?: TireSet | TreadDepthLog | true;
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

function parseOptionalInt(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === "") return undefined;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? undefined : n;
}

export async function createTireSet(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    brand: formData.get("brand") as string,
    model: formData.get("model") as string,
    frontSize: formData.get("frontSize") as string,
    rearSize: parseOptionalString(formData.get("rearSize")),
    quantity: parseInt(String(formData.get("quantity") ?? "4"), 10) || 4,
    dotCode: parseOptionalString(formData.get("dotCode")),
    maxHeatCycles: parseOptionalInt(formData.get("maxHeatCycles")),
    rearCost: parseOptionalNumber(formData.get("rearCost")),
    compound: parseOptionalString(formData.get("compound")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    cost: parseOptionalNumber(formData.get("cost")),
    status: (formData.get("status") as string) || "Active",
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createTireSetSchema.safeParse(raw);
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

  const tireSet = await prisma.tireSet.create({
    data: {
      carId: parsed.data.carId,
      brand: parsed.data.brand,
      model: parsed.data.model,
      frontSize: parsed.data.frontSize,
      rearSize: parsed.data.rearSize,
      quantity: parsed.data.quantity,
      dotCode: parsed.data.dotCode,
      maxHeatCycles: parsed.data.maxHeatCycles,
      rearCost: parsed.data.rearCost,
      compound: parsed.data.compound,
      purchaseDate: parsed.data.purchaseDate
        ? new Date(parsed.data.purchaseDate)
        : undefined,
      cost: parsed.data.cost,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/tires`);
  return { data: tireSet };
}

export async function updateTireSet(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const raw = {
    tireSetId: formData.get("tireSetId") as string,
    brand: parseOptionalString(formData.get("brand")),
    model: parseOptionalString(formData.get("model")),
    frontSize: parseOptionalString(formData.get("frontSize")),
    rearSize: parseOptionalString(formData.get("rearSize")),
    quantity: parseOptionalInt(formData.get("quantity")),
    dotCode: parseOptionalString(formData.get("dotCode")),
    maxHeatCycles: parseOptionalInt(formData.get("maxHeatCycles")),
    rearCost: parseOptionalNumber(formData.get("rearCost")),
    compound: parseOptionalString(formData.get("compound")),
    purchaseDate: parseOptionalString(formData.get("purchaseDate")),
    cost: parseOptionalNumber(formData.get("cost")),
    status: parseOptionalString(formData.get("status")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = updateTireSetSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.tireSet.findFirst({
    where: { id: parsed.data.tireSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const tireSet = await prisma.tireSet.update({
    where: { id: parsed.data.tireSetId },
    data: {
      ...(parsed.data.brand !== undefined && { brand: parsed.data.brand }),
      ...(parsed.data.model !== undefined && { model: parsed.data.model }),
      ...(parsed.data.frontSize !== undefined && {
        frontSize: parsed.data.frontSize,
      }),
      ...(parsed.data.rearSize !== undefined && {
        rearSize: parsed.data.rearSize,
      }),
      ...(parsed.data.quantity !== undefined && {
        quantity: parsed.data.quantity,
      }),
      ...(parsed.data.dotCode !== undefined && {
        dotCode: parsed.data.dotCode,
      }),
      ...(parsed.data.maxHeatCycles !== undefined && {
        maxHeatCycles: parsed.data.maxHeatCycles,
      }),
      ...(parsed.data.rearCost !== undefined && {
        rearCost: parsed.data.rearCost,
      }),
      ...(parsed.data.compound !== undefined && {
        compound: parsed.data.compound,
      }),
      ...(parsed.data.purchaseDate !== undefined && {
        purchaseDate: new Date(parsed.data.purchaseDate),
      }),
      ...(parsed.data.cost !== undefined && { cost: parsed.data.cost }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  revalidatePath(`/garage/${existing.car.id}/tires`);
  return { data: tireSet };
}

export async function deleteTireSet(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const tireSetId = formData.get("tireSetId");
  if (!tireSetId || typeof tireSetId !== "string") {
    return { error: "Tire set ID is required" };
  }

  const existing = await prisma.tireSet.findFirst({
    where: { id: tireSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  await prisma.tireSet.delete({
    where: { id: tireSetId },
  });

  revalidatePath(`/garage/${existing.car.id}/tires`);
  return { data: true };
}

export async function addTreadDepthLog(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const raw = {
    tireSetId: formData.get("tireSetId") as string,
    depth: parseOptionalNumber(formData.get("depth")),
    date: parseOptionalString(formData.get("date")),
    position: parseOptionalString(formData.get("position")),
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = addTreadDepthSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const tireSet = await prisma.tireSet.findFirst({
    where: { id: parsed.data.tireSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!tireSet) {
    return { error: "Not found" };
  }

  const log = await prisma.treadDepthLog.create({
    data: {
      tireSetId: parsed.data.tireSetId,
      depth: parsed.data.depth,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      position: parsed.data.position,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${tireSet.car.id}/tires/${parsed.data.tireSetId}`);
  return { data: log };
}

export async function deleteTreadDepthLog(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const logId = formData.get("logId");
  if (!logId || typeof logId !== "string") {
    return { error: "Log ID is required" };
  }

  const existing = await prisma.treadDepthLog.findFirst({
    where: { id: logId, tireSet: { car: { userId } } },
    include: { tireSet: { select: { id: true, carId: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  await prisma.treadDepthLog.delete({
    where: { id: logId },
  });

  revalidatePath(
    `/garage/${existing.tireSet.carId}/tires/${existing.tireSet.id}`,
  );
  return { data: true };
}

export async function incrementHeatCycles(
  _prevState: TireSetActionState,
  formData: FormData,
): Promise<TireSetActionState> {
  const userId = await requireAuth();

  const tireSetId = formData.get("tireSetId");
  if (!tireSetId || typeof tireSetId !== "string") {
    return { error: "Tire set ID is required" };
  }

  const existing = await prisma.tireSet.findFirst({
    where: { id: tireSetId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const tireSet = await prisma.tireSet.update({
    where: { id: tireSetId },
    data: { heatCycles: { increment: 1 } },
  });

  revalidatePath(`/garage/${existing.car.id}/tires/${tireSetId}`);
  return { data: tireSet };
}
