"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Car } from "@prisma/client";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  CarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCar } from "@/lib/actions/car";
import type { CarActionState } from "@/lib/actions/car";

interface CarCardProps {
  car: Car;
}

const initialState: CarActionState = {};

export function CarCard({ car }: CarCardProps) {
  const [, deleteAction, isDeleting] = useActionState(deleteCar, initialState);

  const displayName = car.nickname
    ? car.nickname
    : `${car.year} ${car.make} ${car.model}`;

  const subline = car.nickname
    ? `${car.year} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ""}`
    : car.trim
      ? car.trim
      : null;

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs transition-shadow hover:shadow-md">
      {/* Dropdown menu — top-right corner */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Car options"
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/garage/${car.id}/edit`}>
                <PencilIcon />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild variant="destructive">
              <form action={deleteAction}>
                <input type="hidden" name="carId" value={car.id} />
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2"
                >
                  <Trash2Icon />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card link wraps the main content */}
      <Link href={`/garage/${car.id}`} className="flex gap-4">
        {/* Photo placeholder */}
        <div className="flex-shrink-0 size-14 rounded-full bg-muted flex items-center justify-center ring-1 ring-foreground/10">
          <CarIcon className="size-6 text-muted-foreground" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 min-w-0 flex-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{displayName}</span>
            {car.primaryUse && (
              <Badge variant="secondary" className="shrink-0">
                {car.primaryUse}
              </Badge>
            )}
          </div>
          {subline && (
            <p className="text-sm text-muted-foreground truncate">{subline}</p>
          )}
          {car.currentOdometer !== null &&
            car.currentOdometer !== undefined && (
              <p className="text-sm text-muted-foreground">
                {car.currentOdometer.toLocaleString()} mi
              </p>
            )}
        </div>
      </Link>
    </div>
  );
}
