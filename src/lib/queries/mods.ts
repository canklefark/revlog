import { prisma } from "@/lib/prisma";
import type { Mod } from "@prisma/client";

export async function getModsByCategory(carId: string): Promise<{
  grouped: Record<string, Mod[]>;
  totalCost: number;
}> {
  const mods = await prisma.mod.findMany({
    where: { carId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  const grouped: Record<string, Mod[]> = {};
  let totalCost = 0;

  for (const mod of mods) {
    if (!grouped[mod.category]) grouped[mod.category] = [];
    grouped[mod.category].push(mod);
    if (mod.cost != null) totalCost += mod.cost;
  }

  return { grouped, totalCost };
}
