import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { BrakeSetForm } from "@/components/garage/brake-set-form";
import { updateBrakeSet } from "@/lib/actions/brake-set";

export default async function EditBrakeSetPage({
  params,
}: {
  params: Promise<{ carId: string; brakeSetId: string }>;
}) {
  const { carId, brakeSetId } = await params;
  const userId = await requireAuth();

  const brakeSet = await prisma.brakeSet.findFirst({
    where: { id: brakeSetId, car: { userId } },
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

  if (!brakeSet || brakeSet.car.userId !== userId) notFound();

  const displayName =
    brakeSet.car.nickname ??
    `${brakeSet.car.year} ${brakeSet.car.make} ${brakeSet.car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/brakes`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Brakes
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Brake Set</h1>
      </div>

      <BrakeSetForm
        action={updateBrakeSet}
        carId={carId}
        defaultValues={brakeSet}
      />
    </div>
  );
}
