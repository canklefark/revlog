"use server";

import { revalidatePath } from "next/cache";
import type { Run } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createRunSchema, updateRunSchema } from "@/lib/validations/run";
import { calculateAdjustedTime } from "@/lib/utils/penalty-calc";
import type { PenaltyItem } from "@/lib/utils/penalty-calc";

export type RunActionState = {
  data?: Run | true;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

export async function createRun(
  _prevState: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const userId = await requireAuth();

  const eventId = formData.get("eventId") as string;
  const carId = formData.get("carId") as string;
  const runNumberRaw = Number(formData.get("runNumber"));
  const rawTime = Number(formData.get("rawTime"));
  const penaltiesStr = formData.get("penalties");
  const conditionsStr = formData.get("conditions") as string | null;
  const tireSetup = parseOptionalString(formData.get("tireSetup"));
  const notes = parseOptionalString(formData.get("notes"));
  const isDnfStr = formData.get("isDnf");
  const isDnf = isDnfStr === "true";

  let penalties: PenaltyItem[] = [];
  try {
    const parsed = penaltiesStr ? JSON.parse(String(penaltiesStr)) : [];
    penalties = Array.isArray(parsed) ? parsed : [];
  } catch {
    penalties = [];
  }

  const conditions = conditionsStr
    ? conditionsStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  // Auto-calculate runNumber if not provided or zero
  let runNumber = runNumberRaw;
  if (!runNumber || runNumber === 0) {
    const maxRun = await prisma.run.findFirst({
      where: { eventId },
      orderBy: { runNumber: "desc" },
      select: { runNumber: true },
    });
    runNumber = (maxRun?.runNumber ?? 0) + 1;
  }

  const raw = {
    eventId,
    carId,
    runNumber,
    rawTime,
    penalties,
    conditions,
    tireSetup,
    notes,
    isDnf,
  };

  const parsed = createRunSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event || event.userId !== userId) {
    return { error: "Not found" };
  }

  const adjustedTime = calculateAdjustedTime(
    parsed.data.rawTime,
    parsed.data.penalties as PenaltyItem[],
    parsed.data.isDnf,
  );

  const run = await prisma.run.create({
    data: {
      eventId: parsed.data.eventId,
      carId: parsed.data.carId,
      runNumber: parsed.data.runNumber,
      rawTime: parsed.data.rawTime,
      penalties: parsed.data.penalties,
      adjustedTime: adjustedTime ?? undefined,
      isDnf: parsed.data.isDnf,
      conditions: parsed.data.conditions,
      tireSetup: parsed.data.tireSetup,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/events/${eventId}/runs`);
  revalidatePath("/times");
  return { data: run };
}

export async function updateRun(
  _prevState: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const userId = await requireAuth();

  const runId = formData.get("runId") as string;
  const rawTimeRaw = formData.get("rawTime");
  const penaltiesStr = formData.get("penalties");
  const conditionsStr = formData.get("conditions") as string | null;
  const tireSetup = parseOptionalString(formData.get("tireSetup"));
  const notes = parseOptionalString(formData.get("notes"));
  const isDnfStr = formData.get("isDnf");
  const runNumberRaw = formData.get("runNumber");

  const rawTime =
    rawTimeRaw !== null && rawTimeRaw !== "" ? Number(rawTimeRaw) : undefined;

  let penalties: PenaltyItem[] | undefined;
  if (penaltiesStr !== null && penaltiesStr !== "") {
    try {
      const p = JSON.parse(String(penaltiesStr));
      penalties = Array.isArray(p) ? p : undefined;
    } catch {
      penalties = undefined;
    }
  }

  const conditions =
    conditionsStr !== null && conditionsStr !== ""
      ? conditionsStr
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

  const isDnf =
    isDnfStr !== null && isDnfStr !== "" ? isDnfStr === "true" : undefined;

  const runNumber =
    runNumberRaw !== null && runNumberRaw !== ""
      ? Number(runNumberRaw)
      : undefined;

  const raw = {
    runId,
    rawTime,
    penalties,
    conditions,
    tireSetup,
    notes,
    isDnf,
    runNumber,
  };

  const parsed = updateRunSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.run.findUnique({
    where: { id: parsed.data.runId },
    include: { event: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.event.userId !== userId) {
    return { error: "Not found" };
  }

  // Recalculate adjustedTime if any relevant fields changed
  const newRawTime = parsed.data.rawTime ?? existing.rawTime;
  const existingPenalties = existing.penalties as unknown as PenaltyItem[];
  const newPenalties =
    (parsed.data.penalties as PenaltyItem[] | undefined) ?? existingPenalties;
  const newIsDnf = parsed.data.isDnf ?? existing.isDnf;

  const adjustedTime = calculateAdjustedTime(
    newRawTime,
    newPenalties,
    newIsDnf,
  );

  const run = await prisma.run.update({
    where: { id: parsed.data.runId, event: { userId } },
    data: {
      ...(parsed.data.rawTime !== undefined && {
        rawTime: parsed.data.rawTime,
      }),
      ...(parsed.data.penalties !== undefined && {
        penalties: parsed.data.penalties,
      }),
      ...(parsed.data.conditions !== undefined && {
        conditions: parsed.data.conditions,
      }),
      ...(parsed.data.tireSetup !== undefined && {
        tireSetup: parsed.data.tireSetup,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.runNumber !== undefined && {
        runNumber: parsed.data.runNumber,
      }),
      ...(parsed.data.isDnf !== undefined && { isDnf: parsed.data.isDnf }),
      adjustedTime: adjustedTime,
    },
  });

  revalidatePath(`/events/${existing.event.id}/runs`);
  revalidatePath("/times");
  return { data: run };
}

export async function deleteRun(
  _prevState: RunActionState,
  formData: FormData,
): Promise<RunActionState> {
  const userId = await requireAuth();

  const runId = formData.get("runId");
  if (!runId || typeof runId !== "string") {
    return { error: "Run ID is required" };
  }

  const existing = await prisma.run.findUnique({
    where: { id: runId },
    include: { event: { select: { userId: true, id: true } } },
  });

  if (!existing || existing.event.userId !== userId) {
    return { error: "Not found" };
  }

  await prisma.run.delete({
    where: { id: runId, event: { userId } },
  });

  revalidatePath(`/events/${existing.event.id}/runs`);
  revalidatePath("/times");
  return { data: true };
}
