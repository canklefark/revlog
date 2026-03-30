import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ModForm } from "@/components/garage/mod-form";
import { updateMod } from "@/lib/actions/mod";

export default async function EditModPage({
  params,
}: {
  params: Promise<{ carId: string; modId: string }>;
}) {
  const { carId, modId } = await params;
  const userId = await requireAuth();

  const mod = await prisma.mod.findUnique({
    where: { id: modId },
    include: {
      car: {
        select: {
          userId: true,
          nickname: true,
          year: true,
          make: true,
          model: true,
        },
      },
    },
  });

  if (!mod || mod.car.userId !== userId) notFound();

  const displayName =
    mod.car.nickname ?? `${mod.car.year} ${mod.car.make} ${mod.car.model}`;

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/mods`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Modifications
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Modification</h1>
      </div>

      <ModForm action={updateMod} carId={carId} defaultValues={mod} />
    </main>
  );
}
