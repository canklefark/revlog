import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMaintenanceAlerts } from "@/lib/utils/maintenance-alerts";
import { MaintenancePageClient } from "@/components/garage/maintenance-page-client";
import { ExportButton } from "@/components/shared/export-button";

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({
    where: { id: carId },
  });

  if (!car || car.userId !== userId) {
    notFound();
  }

  const entries = await prisma.maintenanceEntry.findMany({
    where: { carId },
    orderBy: { date: "desc" },
  });

  const alerts = getMaintenanceAlerts(entries, car.currentOdometer ?? null);

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
          <h1 className="text-2xl font-semibold">Maintenance Log</h1>
        </div>
        <ExportButton section="maintenance" carId={carId} />
      </div>

      <MaintenancePageClient
        entries={entries}
        alerts={alerts}
        carId={carId}
        carOdometer={car.currentOdometer ?? null}
      />
    </main>
  );
}
