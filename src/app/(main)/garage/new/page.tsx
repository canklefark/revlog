import { requireAuth } from "@/lib/auth-utils";
import { CarForm } from "@/components/garage/car-form";
import { createCar } from "@/lib/actions/car";

export default async function NewCarPage() {
  await requireAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Add Car</h1>
      <CarForm action={createCar} />
    </div>
  );
}
