import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getModsByCategory } from "@/lib/queries/mods";
import { ModList } from "@/components/garage/mod-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const totalMods = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
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
        <div className="flex items-center gap-2">
          <ExportButton section="mods" carId={carId} />
          <Button asChild size="sm">
            <Link href={`/garage/${carId}/mods/new`}>
              <PlusIcon />
              Add Mod
            </Link>
          </Button>
        </div>
      </div>

      {totalMods > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {totalMods} modification{totalMods !== 1 ? "s" : ""}
              </span>
              {totalCost > 0 && (
                <span className="font-semibold">
                  $
                  {totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  total
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ModList grouped={grouped} carId={carId} />
    </main>
  );
}
