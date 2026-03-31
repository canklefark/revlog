"use server";

import { revalidatePath } from "next/cache";
import type { AdditionalCost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createAdditionalCostSchema,
  deleteAdditionalCostSchema,
} from "@/lib/validations/additional-cost";

export type AdditionalCostActionState = {
  data?: AdditionalCost | true;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAdditionalCost(
  _prevState: AdditionalCostActionState,
  formData: FormData,
): Promise<AdditionalCostActionState> {
  const userId = await requireAuth();

  const raw = {
    eventId: formData.get("eventId") as string,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount")),
  };

  const parsed = createAdditionalCostSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });

  if (!event || event.userId !== userId) {
    return { error: "Not found" };
  }

  const cost = await prisma.additionalCost.create({
    data: {
      eventId: parsed.data.eventId,
      description: parsed.data.description,
      amount: parsed.data.amount,
    },
  });

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/dashboard");
  return { data: cost };
}

export async function deleteAdditionalCost(
  _prevState: AdditionalCostActionState,
  formData: FormData,
): Promise<AdditionalCostActionState> {
  const userId = await requireAuth();

  const raw = {
    costId: formData.get("costId") as string,
  };

  const parsed = deleteAdditionalCostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Cost ID is required" };
  }

  const existing = await prisma.additionalCost.findUnique({
    where: { id: parsed.data.costId },
    include: { event: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.event.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.additionalCost.delete({
    where: { id: parsed.data.costId, event: { userId } },
  });

  revalidatePath(`/events/${existing.event.id}`);
  revalidatePath("/dashboard");
  return { data: true };
}
