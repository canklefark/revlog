import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getParts } from "@/lib/queries/parts";
import { PartsPageClient } from "@/components/parts/parts-page-client";
import { BackLink } from "@/components/shared/back-link";

export default async function CarPartsPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: {
      id: true,
      userId: true,
      year: true,
      make: true,
      model: true,
      nickname: true,
    },
  });

  if (!car || car.userId !== userId) {
    notFound();
  }

  const parts = await getParts(userId, carId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="w-full">
      <BackLink href={`/garage/${carId}`} label={displayName} />
      <PartsPageClient parts={parts} carId={carId} />
    </div>
  );
}
