import { prisma } from "@/lib/prisma";

export async function getWishlistItems(carId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { carId },
    orderBy: [{ createdAt: "desc" }],
  });

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  items.sort((a, b) => {
    const aP = priorityOrder[a.priority] ?? 1;
    const bP = priorityOrder[b.priority] ?? 1;
    return aP - bP;
  });

  const estimatedTotal = items.reduce(
    (sum, item) => sum + (item.estimatedCost ?? 0),
    0,
  );

  return { items, estimatedTotal };
}
