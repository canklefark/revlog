import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { MaintenanceForm } from "@/components/garage/maintenance-form";
import { updateMaintenance } from "@/lib/actions/maintenance";

export default async function EditMaintenancePage({
  params,
}: {
  params: Promise<{ carId: string; entryId: string }>;
}) {
  const { carId, entryId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({
    where: { id: carId },
  });

  if (!car || car.userId !== userId) {
    notFound();
  }

  const entry = await prisma.maintenanceEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry || entry.carId !== carId) {
    notFound();
  }

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/maintenance`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Maintenance
        </Link>
        <h1 className="text-2xl font-semibold">Edit Maintenance Entry</h1>
      </div>

      <MaintenanceForm
        action={updateMaintenance}
        carId={carId}
        defaultValues={entry}
      />
    </main>
  );
}
