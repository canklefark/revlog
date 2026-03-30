import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CarList } from "@/components/garage/car-list";
import { Button } from "@/components/ui/button";

export default async function GaragePage() {
  const userId = await requireAuth();

  const cars = await prisma.car.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Garage</h1>
        <Button asChild>
          <Link href="/garage/new">Add Car</Link>
        </Button>
      </div>
      <CarList cars={cars} />
    </main>
  );
}
