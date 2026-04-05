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
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{items.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length === 1 ? "Item" : "Items"}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-500">
                  {highCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High priority
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-yellow-500">
                  {medCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Medium priority
                </p>
              </div>
              {estimatedTotal > 0 ? (
                <div>
                  <p className="text-2xl font-semibold">
                    ~$
                    {estimatedTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated total
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-semibold">{lowCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Low priority
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <WishlistList items={items} carId={carId} />
    </main>
  );
}
