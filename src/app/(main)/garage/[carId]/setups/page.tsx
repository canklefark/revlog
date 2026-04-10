import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getSetupsForCar } from "@/lib/queries/suspension-setups";
import { SetupList } from "@/components/garage/setup-list";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/shared/back-link";

export default async function SetupsPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const setups = await getSetupsForCar(carId, userId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <BackLink href={`/garage/${carId}`} label={displayName} />
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Suspension Setups</h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/garage/${carId}/setups/new`}>
            <PlusIcon />
            New Setup
          </Link>
        </Button>
      </div>

      <SetupList setups={setups} carId={carId} />
    </main>
  );
}
