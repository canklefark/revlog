import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTireSetDetail } from "@/lib/queries/tire-sets";
import { TireSetDetail } from "@/components/garage/tire-set-detail";

export default async function TireSetDetailPage({
  params,
}: {
  params: Promise<{ carId: string; tireSetId: string }>;
}) {
  const { carId, tireSetId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const detail = await getTireSetDetail(tireSetId, userId);
  if (!detail) notFound();

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/tires`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Tires
        </Link>
      </div>

      <TireSetDetail
        tireSet={detail.tireSet}
        maintenanceHistory={detail.maintenanceHistory}
        carId={carId}
      />
    </div>
  );
}
