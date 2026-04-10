import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { BrakeSetForm } from "@/components/garage/brake-set-form";
import { createBrakeSet } from "@/lib/actions/brake-set";

export default async function NewBrakeSetPage({
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
          href={`/garage/${carId}/brakes`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Brakes
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Add Brake Set</h1>
      </div>

      <BrakeSetForm action={createBrakeSet} carId={carId} />
    </div>
  );
}
