import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PencilIcon,
  Disc,
  Gauge,
  Sliders,
  Wrench,
  Star,
  ClipboardList,
  DollarSign,
} from "lucide-react";
import { BackLink } from "@/components/shared/back-link";
import { DeleteCarButton } from "@/components/garage/delete-car-button";
import { getMaintenanceAlerts } from "@/lib/utils/maintenance-alerts";
import { getTireSetsForCar } from "@/lib/queries/tire-sets";
import { getBrakeSetsForCar } from "@/lib/queries/brake-sets";
import { getSetupsForCar } from "@/lib/queries/suspension-setups";
import { getExpenseSummary } from "@/lib/queries/expenses";
import type { AlertLevel } from "@/lib/utils/maintenance-alerts";

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

  const [
    modCount,
    modTotalResult,
    wishlistCount,
    maintenanceEntries,
    tireSetsData,
    brakeSetsData,
    setups,
    expenseSummary,
  ] = await Promise.all([
    prisma.mod.count({ where: { carId } }),
    prisma.mod.aggregate({ where: { carId }, _sum: { cost: true } }),
    prisma.wishlistItem.count({ where: { carId } }),
    prisma.maintenanceEntry.findMany({
      where: { carId, car: { userId } },
    }),
    getTireSetsForCar(carId, userId),
    getBrakeSetsForCar(carId, userId),
    getSetupsForCar(carId, userId),
    getExpenseSummary(carId, userId),
  ]);

  const modTotal = modTotalResult._sum.cost ?? 0;

  const maintenanceAlerts = getMaintenanceAlerts(
    maintenanceEntries,
    car.currentOdometer,
  );

  // Start from the worst maintenance-derived level
  const maintenanceWorst: AlertLevel = maintenanceAlerts[0]?.level ?? "none";

  // Compute brake-wear level across all active brake sets
  const LEVEL_ORDER: Record<AlertLevel, number> = {
    overdue: 0,
    due: 1,
    upcoming: 2,
    none: 3,
  };

  let brakeLevel: AlertLevel = "none";
  for (const brakeSet of brakeSetsData.active) {
    const wear = brakeSet.wearRemaining;
    if (wear !== null) {
      if (wear < 5 && LEVEL_ORDER["overdue"] < LEVEL_ORDER[brakeLevel]) {
        brakeLevel = "overdue";
      } else if (
        wear < 20 &&
        wear >= 5 &&
        LEVEL_ORDER["due"] < LEVEL_ORDER[brakeLevel]
      ) {
        brakeLevel = "due";
      }
    }
  }

  // Pick worst of maintenance vs brake wear
  const worstLevel: AlertLevel =
    LEVEL_ORDER[maintenanceWorst] <= LEVEL_ORDER[brakeLevel]
      ? maintenanceWorst
      : brakeLevel;

  const activeSetup = setups.find((s) => s.isActive);

  const displayName = car.nickname
    ? car.nickname
    : `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <BackLink href="/garage" label="Garage" />
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {car.primaryUse && (
              <Badge variant="secondary">{car.primaryUse}</Badge>
            )}
            {worstLevel === "none" && (
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                Race Ready
              </Badge>
            )}
            {(worstLevel === "upcoming" || worstLevel === "due") && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                Maintenance Due
              </Badge>
            )}
            {worstLevel === "overdue" && (
              <Badge variant="destructive">Not Race Ready</Badge>
            )}
          </div>
          {car.nickname && (
            <p className="text-muted-foreground mt-0.5">
              {car.year} {car.make} {car.model}
              {car.trim ? ` ${car.trim}` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/garage/${carId}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
          <DeleteCarButton carId={carId} displayName={displayName} />
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tires */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Disc className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Tires</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/tires`}>View Tires</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tireSetsData.active.length > 0
                ? `${tireSetsData.active.length} active set${tireSetsData.active.length !== 1 ? "s" : ""}`
                : "No active tire sets"}
            </p>
          </CardContent>
        </Card>

        {/* Brakes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Brakes</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/brakes`}>View Brakes</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {brakeSetsData.active.length > 0
                ? `${brakeSetsData.active.length} active set${brakeSetsData.active.length !== 1 ? "s" : ""}`
                : "No active brake sets"}
            </p>
          </CardContent>
        </Card>

        {/* Setups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Setups</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/setups`}>View Setups</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeSetup ? activeSetup.name : "No active setup"}
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Modifications</CardTitle>
            </div>
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

        {/* Wishlist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Wishlist</CardTitle>
            </div>
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

        {/* Maintenance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Maintenance</CardTitle>
            </div>
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

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Expenses</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/garage/${carId}/expenses`}>View Expenses</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {expenseSummary.summary.currentYear > 0
                ? `$${expenseSummary.summary.currentYear.toLocaleString()} this year`
                : "No expenses logged this year."}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
