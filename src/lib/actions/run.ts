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
  isPB?: boolean;
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
  const tireSetId = parseOptionalString(formData.get("tireSetId"));
  const brakeSetId = parseOptionalString(formData.get("brakeSetId"));
  const setupId = parseOptionalString(formData.get("setupId"));
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
    tireSetId,
    brakeSetId,
    setupId,
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

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.run.create({
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
        tireSetId: parsed.data.tireSetId,
        brakeSetId: parsed.data.brakeSetId,
        setupId: parsed.data.setupId,
        notes: parsed.data.notes,
      },
    });

    if (parsed.data.tireSetId) {
      await tx.tireSet.update({
        where: { id: parsed.data.tireSetId, car: { userId } },
        data: { heatCycles: { increment: 1 } },
      });
    }

    if (parsed.data.brakeSetId) {
      await tx.brakeSet.update({
        where: { id: parsed.data.brakeSetId, car: { userId } },
        data: { heatCycles: { increment: 1 } },
      });
    }

    return created;
  });

  revalidatePath(`/events/${eventId}/runs`);
  revalidatePath(`/events/${eventId}/session`);
  revalidatePath("/times");

  // PB detection: check if this is a new personal best for this car + event type
  let isPB = false;
  if (adjustedTime !== null) {
    const previousBest = await prisma.run.findFirst({
      where: {
        NOT: { id: run.id },
        carId: parsed.data.carId,
        isDnf: false,
        adjustedTime: { not: null },
        event: { userId, type: event.type },
      },
      orderBy: { adjustedTime: "asc" },
      select: { adjustedTime: true },
    });
    isPB =
      previousBest === null ||
      adjustedTime < (previousBest.adjustedTime ?? Infinity);
  }

  return { data: run, isPB };
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
  const tireSetId = parseOptionalString(formData.get("tireSetId"));
  const brakeSetId = parseOptionalString(formData.get("brakeSetId"));
  const setupId = parseOptionalString(formData.get("setupId"));
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
    tireSetId,
    brakeSetId,
    setupId,
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

  const tireSetIdChanged =
    parsed.data.tireSetId !== undefined &&
    parsed.data.tireSetId !== (existing.tireSetId ?? undefined);
  const brakeSetIdChanged =
    parsed.data.brakeSetId !== undefined &&
    parsed.data.brakeSetId !== (existing.brakeSetId ?? undefined);

  const run = await prisma.$transaction(async (tx) => {
    // Handle tireSet heat cycle transfer
    if (tireSetIdChanged) {
      const oldTireSetId = existing.tireSetId;
      const newTireSetId = parsed.data.tireSetId;

      if (oldTireSetId) {
        const old = await tx.tireSet.findUnique({
          where: { id: oldTireSetId },
          select: { heatCycles: true },
        });
        if (old && old.heatCycles > 0) {
          await tx.tireSet.update({
            where: { id: oldTireSetId, car: { userId } },
            data: { heatCycles: { decrement: 1 } },
          });
        }
      }

      if (newTireSetId) {
        await tx.tireSet.update({
          where: { id: newTireSetId, car: { userId } },
          data: { heatCycles: { increment: 1 } },
        });
      }
    }

    // Handle brakeSet heat cycle transfer
    if (brakeSetIdChanged) {
      const oldBrakeSetId = existing.brakeSetId;
      const newBrakeSetId = parsed.data.brakeSetId;

      if (oldBrakeSetId) {
        const old = await tx.brakeSet.findUnique({
          where: { id: oldBrakeSetId },
          select: { heatCycles: true },
        });
        if (old && old.heatCycles > 0) {
          await tx.brakeSet.update({
            where: { id: oldBrakeSetId, car: { userId } },
            data: { heatCycles: { decrement: 1 } },
          });
        }
      }

      if (newBrakeSetId) {
        await tx.brakeSet.update({
          where: { id: newBrakeSetId, car: { userId } },
          data: { heatCycles: { increment: 1 } },
        });
      }
    }

    return tx.run.update({
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
        ...(parsed.data.tireSetId !== undefined && {
          tireSetId: parsed.data.tireSetId || null,
        }),
        ...(parsed.data.brakeSetId !== undefined && {
          brakeSetId: parsed.data.brakeSetId || null,
        }),
        ...(parsed.data.setupId !== undefined && {
          setupId: parsed.data.setupId || null,
        }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        ...(parsed.data.runNumber !== undefined && {
          runNumber: parsed.data.runNumber,
        }),
        ...(parsed.data.isDnf !== undefined && { isDnf: parsed.data.isDnf }),
        adjustedTime: adjustedTime,
      },
    });
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

  await prisma.$transaction(async (tx) => {
    if (existing.tireSetId) {
      const tireSet = await tx.tireSet.findUnique({
        where: { id: existing.tireSetId },
        select: { heatCycles: true },
      });
      if (tireSet && tireSet.heatCycles > 0) {
        await tx.tireSet.update({
          where: { id: existing.tireSetId, car: { userId } },
          data: { heatCycles: { decrement: 1 } },
        });
      }
    }

    if (existing.brakeSetId) {
      const brakeSet = await tx.brakeSet.findUnique({
        where: { id: existing.brakeSetId },
        select: { heatCycles: true },
      });
      if (brakeSet && brakeSet.heatCycles > 0) {
        await tx.brakeSet.update({
          where: { id: existing.brakeSetId, car: { userId } },
          data: { heatCycles: { decrement: 1 } },
        });
      }
    }

    await tx.run.delete({
      where: { id: runId, event: { userId } },
    });
  });

  revalidatePath(`/events/${existing.event.id}/runs`);
  revalidatePath("/times");
  return { data: true };
}
