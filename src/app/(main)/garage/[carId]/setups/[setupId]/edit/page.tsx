import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "@/components/garage/setup-form";
import { updateSetup } from "@/lib/actions/suspension-setup";

export default async function EditSetupPage({
  params,
}: {
  params: Promise<{ carId: string; setupId: string }>;
}) {
  const { carId, setupId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const setup = await prisma.suspensionSetup.findFirst({
    where: { id: setupId, car: { userId } },
  });
  if (!setup) notFound();

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/setups/${setupId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Suspension Setups / {setup.name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Setup</h1>
      </div>

      <SetupForm action={updateSetup} carId={carId} defaultValues={setup} />
    </div>
  );
}
