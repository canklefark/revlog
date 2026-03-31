import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getWishlistItems } from "@/lib/queries/wishlist";
import { WishlistList } from "@/components/garage/wishlist-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          <h1 className="text-2xl font-semibold">Wishlist</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton section="wishlist" carId={carId} />
          <Button asChild size="sm">
            <Link href={`/garage/${carId}/wishlist/new`}>
              <PlusIcon />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              {estimatedTotal > 0 && (
                <span className="font-semibold">
                  ~$
                  {estimatedTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  estimated
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <WishlistList items={items} carId={carId} />
    </main>
  );
}
