import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type PartWithCar = Prisma.PartGetPayload<{
  include: {
    car: {
      select: { id: true; year: true; make: true; model: true; nickname: true };
    };
  };
}>;

export async function getParts(userId: string): Promise<PartWithCar[]> {
  return prisma.part.findMany({
    where: { userId },
    include: {
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
