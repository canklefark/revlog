"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CarForm } from "@/components/garage/car-form";
import { CarList } from "@/components/garage/car-list";
import { createCar } from "@/lib/actions/car";
import type { Car } from "@prisma/client";

interface GaragePageClientProps {
  cars: Car[];
}

export function GaragePageClient({ cars }: GaragePageClientProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Garage</h1>
        <Button onClick={() => setAddOpen(true)}>Add Car</Button>
      </div>

      <CarList cars={cars} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Car</DialogTitle>
          </DialogHeader>
          <CarForm
            action={createCar}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
