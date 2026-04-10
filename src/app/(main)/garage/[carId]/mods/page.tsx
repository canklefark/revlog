import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getModsByCategory } from "@/lib/queries/mods";
import { ModsPageClient } from "@/components/garage/mods-page-client";
import { ExportButton } from "@/components/shared/export-button";

export default async function ModsPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const { grouped, totalCost } = await getModsByCategory(carId, userId);
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
          <h1 className="text-2xl font-semibold">Modifications</h1>
        </div>
        <ExportButton section="mods" carId={carId} />
      </div>

      <ModsPageClient grouped={grouped} totalCost={totalCost} carId={carId} />
    </main>
  );
}
