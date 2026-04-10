import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { TireSetForm } from "@/components/garage/tire-set-form";
import { createTireSet } from "@/lib/actions/tire-set";

export default async function NewTireSetPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

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
        <h1 className="text-2xl font-semibold mt-1">Add Tire Set</h1>
      </div>

      <TireSetForm action={createTireSet} carId={carId} />
    </div>
  );
}
