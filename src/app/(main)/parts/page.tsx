import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getParts } from "@/lib/queries/parts";
import { PartsPageClient } from "@/components/parts/parts-page-client";

export default async function PartsPage() {
  const userId = await requireAuth();

  const [parts, cars] = await Promise.all([
    getParts(userId),
    prisma.car.findMany({
      where: { userId },
      select: { id: true, year: true, make: true, model: true, nickname: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return <PartsPageClient parts={parts} cars={cars} />;
}
