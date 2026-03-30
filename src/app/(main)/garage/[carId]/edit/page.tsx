import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CarForm } from "@/components/garage/car-form";
import { updateCar } from "@/lib/actions/car";
import type { Car } from "@prisma/client";

export default async function EditCarPage({
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

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Car</h1>
      <CarForm action={updateCar} car={car as Car} />
    </main>
  );
}
