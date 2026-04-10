"use server";

import { revalidatePath } from "next/cache";
import type { SuspensionSetup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createSetupSchema,
  updateSetupSchema,
} from "@/lib/validations/suspension-setup";

export type SetupActionState = {
  data?: SuspensionSetup | true;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseOptionalFloat(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function parseOptionalInt(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === "") return undefined;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? undefined : n;
}

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on" || value === "1";
}

function extractSetupFields(formData: FormData) {
  return {
    name: formData.get("name") as string,
    isActive: parseBoolean(formData.get("isActive")),
    camberFL: parseOptionalFloat(formData.get("camberFL")),
    camberFR: parseOptionalFloat(formData.get("camberFR")),
    camberRL: parseOptionalFloat(formData.get("camberRL")),
    camberRR: parseOptionalFloat(formData.get("camberRR")),
    toeFL: parseOptionalFloat(formData.get("toeFL")),
    toeFR: parseOptionalFloat(formData.get("toeFR")),
    toeRL: parseOptionalFloat(formData.get("toeRL")),
    toeRR: parseOptionalFloat(formData.get("toeRR")),
    casterFL: parseOptionalFloat(formData.get("casterFL")),
    casterFR: parseOptionalFloat(formData.get("casterFR")),
    springRateFront: parseOptionalFloat(formData.get("springRateFront")),
    springRateRear: parseOptionalFloat(formData.get("springRateRear")),
    rideHeightFront: parseOptionalFloat(formData.get("rideHeightFront")),
    rideHeightRear: parseOptionalFloat(formData.get("rideHeightRear")),
    damperClicksFrontComp: parseOptionalInt(
      formData.get("damperClicksFrontComp"),
    ),
    damperClicksFrontReb: parseOptionalInt(
      formData.get("damperClicksFrontReb"),
    ),
    damperClicksRearComp: parseOptionalInt(
      formData.get("damperClicksRearComp"),
    ),
    damperClicksRearReb: parseOptionalInt(formData.get("damperClicksRearReb")),
    swayBarFront: parseOptionalString(formData.get("swayBarFront")),
    swayBarRear: parseOptionalString(formData.get("swayBarRear")),
    tirePressureFL: parseOptionalFloat(formData.get("tirePressureFL")),
    tirePressureFR: parseOptionalFloat(formData.get("tirePressureFR")),
    tirePressureRL: parseOptionalFloat(formData.get("tirePressureRL")),
    tirePressureRR: parseOptionalFloat(formData.get("tirePressureRR")),
    notes: parseOptionalString(formData.get("notes")),
  };
}

export async function createSetup(
  _prevState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    ...extractSetupFields(formData),
  };

  const parsed = createSetupSchema.safeParse(raw);
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

  const { carId, ...setupData } = parsed.data;

  const setup = await prisma.suspensionSetup.create({
    data: { carId, ...setupData },
  });

  revalidatePath(`/garage/${carId}/setups`);
  return { data: setup };
}

export async function updateSetup(
  _prevState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const userId = await requireAuth();

  const raw = {
    setupId: formData.get("setupId") as string,
    ...extractSetupFields(formData),
  };

  const parsed = updateSetupSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.suspensionSetup.findFirst({
    where: { id: parsed.data.setupId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const { setupId, ...updateData } = parsed.data;

  const setup = await prisma.suspensionSetup.update({
    where: { id: setupId },
    data: updateData,
  });

  revalidatePath(`/garage/${existing.car.id}/setups`);
  revalidatePath(`/garage/${existing.car.id}/setups/${setupId}`);
  return { data: setup };
}

export async function deleteSetup(
  _prevState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const userId = await requireAuth();

  const setupId = formData.get("setupId");
  if (!setupId || typeof setupId !== "string") {
    return { error: "Setup ID is required" };
  }

  const existing = await prisma.suspensionSetup.findFirst({
    where: { id: setupId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  await prisma.suspensionSetup.delete({
    where: { id: setupId },
  });

  revalidatePath(`/garage/${existing.car.id}/setups`);
  return { data: true };
}

export async function setActiveSetup(
  _prevState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const userId = await requireAuth();

  const setupId = formData.get("setupId");
  if (!setupId || typeof setupId !== "string") {
    return { error: "Setup ID is required" };
  }

  const existing = await prisma.suspensionSetup.findFirst({
    where: { id: setupId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const carId = existing.car.id;

  const setup = await prisma.$transaction(async (tx) => {
    await tx.suspensionSetup.updateMany({
      where: { carId, isActive: true },
      data: { isActive: false },
    });
    return tx.suspensionSetup.update({
      where: { id: setupId },
      data: { isActive: true },
    });
  });

  revalidatePath(`/garage/${carId}/setups`);
  revalidatePath(`/garage/${carId}/setups/${setupId}`);
  return { data: setup };
}
