import { prisma } from "@/lib/prisma";
import type { SuspensionSetup, Run, Event } from "@prisma/client";

export type SetupWithRunCount = SuspensionSetup & { _count: { runs: number } };

export type RunWithEvent = Run & {
  event: Pick<Event, "name" | "startDate" | "type">;
};

export type SetupDetail = SuspensionSetup & {
  runs: RunWithEvent[];
};

export async function getSetupsForCar(
  carId: string,
  userId: string,
): Promise<SetupWithRunCount[]> {
  return prisma.suspensionSetup.findMany({
    where: { carId, car: { userId } },
    include: { _count: { select: { runs: true } } },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function getSetupDetail(
  id: string,
  userId: string,
): Promise<SetupDetail | null> {
  return prisma.suspensionSetup.findFirst({
    where: { id, car: { userId } },
    include: {
      runs: {
        include: {
          event: { select: { name: true, startDate: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
