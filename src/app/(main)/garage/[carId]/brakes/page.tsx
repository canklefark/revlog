import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getBrakeSetsForCar } from "@/lib/queries/brake-sets";
import { BrakeSetList } from "@/components/garage/brake-set-list";
import { Button } from "@/components/ui/button";

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
  const total =
    grouped.active.length + grouped.stored.length + grouped.retired.length;

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
        <Button asChild size="sm">
          <Link href={`/garage/${carId}/brakes/new`}>
            <PlusIcon />
            Add Brake Set
          </Link>
        </Button>
      </div>

      {total > 0 && (
        <p className="text-sm text-muted-foreground mb-6">
          {total} brake set{total !== 1 ? "s" : ""} &mdash;{" "}
          {grouped.active.length} active
        </p>
      )}

      <BrakeSetList grouped={grouped} carId={carId} />
    </main>
  );
}
