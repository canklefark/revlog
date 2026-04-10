import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { GaragePageClient } from "@/components/garage/garage-page-client";

export default async function GaragePage() {
  const userId = await requireAuth();

  const cars = await prisma.car.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="w-full">
      <GaragePageClient cars={cars} />
    </main>
  );
}
