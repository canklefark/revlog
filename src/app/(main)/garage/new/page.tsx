import { requireAuth } from "@/lib/auth-utils";
import { CarForm } from "@/components/garage/car-form";
import { createCar } from "@/lib/actions/car";

export default async function NewCarPage() {
  await requireAuth();

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Add a Car</h1>
      <CarForm action={createCar} />
    </main>
  );
}
