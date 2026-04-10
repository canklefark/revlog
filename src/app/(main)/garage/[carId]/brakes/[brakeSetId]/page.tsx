import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { getBrakeSetDetail } from "@/lib/queries/brake-sets";
import { BrakeSetDetail } from "@/components/garage/brake-set-detail";
import { prisma } from "@/lib/prisma";

export default async function BrakeSetDetailPage({
  params,
}: {
  params: Promise<{ carId: string; brakeSetId: string }>;
}) {
  const { carId, brakeSetId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const result = await getBrakeSetDetail(brakeSetId, userId);
  if (!result) notFound();

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/brakes`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Brakes
        </Link>
      </div>

      <BrakeSetDetail result={result} carId={carId} />
    </div>
  );
}
