import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTireSetsForCar } from "@/lib/queries/tire-sets";
import { TiresPageClient } from "@/components/garage/tires-page-client";

export default async function TiresPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const { active, stored, retired } = await getTireSetsForCar(carId, userId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <TiresPageClient
        active={active}
        stored={stored}
        retired={retired}
        carId={carId}
        displayName={displayName}
      />
    </main>
  );
}
