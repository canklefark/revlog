"use client";

import Link from "next/link";
import type { Car } from "@prisma/client";
import { Car as CarIcon } from "lucide-react";
import { CarCard } from "@/components/garage/car-card";
import { Button } from "@/components/ui/button";

interface CarListProps {
  cars: Car[];
}

export function CarList({ cars }: CarListProps) {
  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <CarIcon
          className="h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-lg">No cars yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first car to get started.
          </p>
        </div>
        <Button asChild>
          <Link href="/garage/new">Add your first car</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {cars.length} {cars.length === 1 ? "car" : "cars"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
