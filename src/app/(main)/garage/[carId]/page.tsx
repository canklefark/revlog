import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PencilIcon } from "lucide-react";

export default async function CarDetailPage({
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

  const [modCount, modTotalResult, wishlistCount] = await Promise.all([
    prisma.mod.count({ where: { carId } }),
    prisma.mod.aggregate({ where: { carId }, _sum: { cost: true } }),
    prisma.wishlistItem.count({ where: { carId } }),
  ]);
  const modTotal = modTotalResult._sum.cost ?? 0;

  const displayName = car.nickname
    ? car.nickname
    : `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {car.primaryUse && (
              <Badge variant="secondary">{car.primaryUse}</Badge>
            )}
          </div>
          {car.nickname && (
            <p className="text-muted-foreground mt-0.5">
              {car.year} {car.make} {car.model}
              {car.trim ? ` ${car.trim}` : ""}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/garage/${carId}/edit`}>
            <PencilIcon />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {car.color && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Color
            </p>
            <p className="font-medium">{car.color}</p>
          </div>
        )}
        {car.currentOdometer !== null && car.currentOdometer !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Odometer
            </p>
            <p className="font-medium">
              {car.currentOdometer.toLocaleString()} mi
            </p>
          </div>
        )}
        {car.vin && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              VIN
            </p>
            <p className="font-medium font-mono text-sm break-all">{car.vin}</p>
          </div>
        )}
        {car.purchaseDate && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Purchased
            </p>
            <p className="font-medium">
              {new Date(car.purchaseDate).toLocaleDateString()}
            </p>
          </div>
        )}
        {car.purchasePrice !== null && car.purchasePrice !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Purchase Price
            </p>
            <p className="font-medium">${car.purchasePrice.toLocaleString()}</p>
          </div>
        )}
      </div>

      {car.notes && (
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Notes
          </p>
          <p className="text-sm">{car.notes}</p>
        </div>
      )}

      <Separator className="mb-8" />

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Modifications</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/mods`}>View Mods</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {modCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {modCount} mod{modCount !== 1 ? "s" : ""}
                {modTotal > 0
                  ? ` · $${modTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`
                  : ""}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No modifications logged yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Wishlist</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/wishlist`}>View Wishlist</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {wishlistCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {wishlistCount} item{wishlistCount !== 1 ? "s" : ""} on the
                wishlist
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No wishlist items yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Maintenance</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/maintenance`}>View Log</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track service history and get alerts when maintenance is due.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
