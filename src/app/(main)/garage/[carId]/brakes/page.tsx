import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getBrakeSetsForCar } from "@/lib/queries/brake-sets";
import { BrakesPageClient } from "@/components/garage/brakes-page-client";

export default async function BrakesPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const grouped = await getBrakeSetsForCar(carId, userId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <Link
            href={`/garage/${carId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {displayName}
          </Link>
          <h1 className="text-2xl font-semibold">Brakes</h1>
        </div>
      </div>

      <BrakesPageClient
        active={grouped.active}
        stored={grouped.stored}
        retired={grouped.retired}
        carId={carId}
      />
    </main>
  );
}
