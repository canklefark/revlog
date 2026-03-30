import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMaintenanceAlerts } from "@/lib/utils/maintenance-alerts";
import { MaintenanceAlertBanner } from "@/components/garage/maintenance-alert-banner";
import { MaintenanceList } from "@/components/garage/maintenance-list";
import { Button } from "@/components/ui/button";

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
    <main className="container mx-auto px-4 py-6 max-w-2xl">
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
        <Button asChild size="sm">
          <Link href={`/garage/${carId}/maintenance/new`}>
            <PlusIcon />
            Add Entry
          </Link>
        </Button>
      </div>

      <MaintenanceAlertBanner alerts={alerts} carId={carId} />

      <MaintenanceList
        entries={entries}
        carId={carId}
        carOdometer={car.currentOdometer ?? null}
      />
    </main>
  );
}
