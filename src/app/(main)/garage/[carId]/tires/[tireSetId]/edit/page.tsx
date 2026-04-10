import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { TireSetForm } from "@/components/garage/tire-set-form";
import { updateTireSet } from "@/lib/actions/tire-set";

export default async function EditTireSetPage({
  params,
}: {
  params: Promise<{ carId: string; tireSetId: string }>;
}) {
  const { carId, tireSetId } = await params;
  const userId = await requireAuth();

  const tireSet = await prisma.tireSet.findFirst({
    where: { id: tireSetId, car: { userId } },
    include: {
      car: {
        select: {
          userId: true,
          nickname: true,
          year: true,
          make: true,
          model: true,
        },
      },
    },
  });

  if (!tireSet) notFound();

  const displayName =
    tireSet.car.nickname ??
    `${tireSet.car.year} ${tireSet.car.make} ${tireSet.car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/tires`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Tires
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Tire Set</h1>
      </div>

      <TireSetForm
        action={updateTireSet}
        carId={carId}
        defaultValues={tireSet}
      />
    </div>
  );
}
