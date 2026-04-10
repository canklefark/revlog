import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getWishlistItems } from "@/lib/queries/wishlist";
import { WishlistPageClient } from "@/components/garage/wishlist-page-client";
import { ExportButton } from "@/components/shared/export-button";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const { items, estimatedTotal } = await getWishlistItems(carId, userId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  const highCount = items.filter((i) => i.priority === "High").length;
  const medCount = items.filter((i) => i.priority === "Medium").length;
  const lowCount = items.filter((i) => i.priority === "Low").length;

  return (
    <main className="max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <Link
            href={`/garage/${carId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {displayName}
          </Link>
          <h1 className="text-2xl font-semibold">Wishlist</h1>
        </div>
        <ExportButton section="wishlist" carId={carId} />
      </div>

      <WishlistPageClient
        items={items}
        estimatedTotal={estimatedTotal}
        highCount={highCount}
        medCount={medCount}
        lowCount={lowCount}
        carId={carId}
      />
    </main>
  );
}
