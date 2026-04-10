import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getSetupDetail } from "@/lib/queries/suspension-setups";
import { SetupDetailView } from "@/components/garage/setup-detail";
import { Button } from "@/components/ui/button";

export default async function SetupDetailPage({
  params,
}: {
  params: Promise<{ carId: string; setupId: string }>;
}) {
  const { carId, setupId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const setup = await getSetupDetail(setupId, userId);
  if (!setup) notFound();

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link
            href={`/garage/${carId}/setups`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {displayName} / Suspension Setups
          </Link>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/garage/${carId}/setups/${setupId}/edit`}>
            <PencilIcon className="size-4 mr-1.5" />
            Edit
          </Link>
        </Button>
      </div>

      <SetupDetailView setup={setup} carId={carId} />
    </div>
  );
}
