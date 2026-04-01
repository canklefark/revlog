"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Car } from "@prisma/client";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  carFormSchema,
  PRIMARY_USE_VALUES,
  type CarFormInput,
} from "@/lib/validations/car";
import type { CarActionState } from "@/lib/actions/car";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CarFormProps {
  action: (
    prevState: CarActionState,
    formData: FormData,
  ) => Promise<CarActionState>;
  car?: Car;
}

const initialState: CarActionState = {};

export function CarForm({ action, car }: CarFormProps) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const purchaseDateDefault = car?.purchaseDate
    ? new Date(car.purchaseDate).toISOString().split("T")[0]
    : "";

  const {
    register,
    formState: { errors: clientErrors },
    setValue,
    watch,
  } = useForm<CarFormInput>({
    resolver: zodResolver(carFormSchema),
    defaultValues: car
      ? {
          year: car.year,
          make: car.make,
          model: car.model,
          nickname: car.nickname ?? undefined,
          trim: car.trim ?? undefined,
          color: car.color ?? undefined,
          vin: car.vin ?? undefined,
          purchaseDate: purchaseDateDefault || undefined,
          purchasePrice: car.purchasePrice ?? undefined,
          currentOdometer: car.currentOdometer ?? undefined,
          primaryUse:
            (car.primaryUse as CarFormInput["primaryUse"]) ?? undefined,
          notes: car.notes ?? undefined,
        }
      : undefined,
  });

  const primaryUseValue = watch("primaryUse");

  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state) return;
    if (state.error) toast.error(state.error);
    if (state.data) toast.success(car ? "Car updated." : "Car added.");
  }, [state, car]);

  const fieldError = (field: keyof CarFormInput): string | undefined => {
    const client = clientErrors[field];
    if (client?.message) return client.message as string;
    const server = state.fieldErrors?.[field];
    if (server?.length) return server[0];
    return undefined;
  };

  return (
    <form action={formAction} className="space-y-5">
      {car && <input type="hidden" name="carId" value={car.id} />}

      {/* Required / common fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            placeholder="2020"
            aria-invalid={!!fieldError("year")}
            {...register("year", { valueAsNumber: true })}
          />
          {fieldError("year") && (
            <p className="text-xs text-destructive">{fieldError("year")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            type="text"
            placeholder="Subaru"
            aria-invalid={!!fieldError("make")}
            {...register("make")}
          />
          {fieldError("make") && (
            <p className="text-xs text-destructive">{fieldError("make")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            type="text"
            placeholder="WRX"
            aria-invalid={!!fieldError("model")}
            {...register("model")}
          />
          {fieldError("model") && (
            <p className="text-xs text-destructive">{fieldError("model")}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          type="text"
          placeholder="The Blue Beast"
          {...register("nickname")}
        />
      </div>

      {/* More Details collapsible */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
        >
          <span>More Details</span>
          {showMore ? (
            <ChevronUpIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          )}
        </button>

        {showMore && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  type="text"
                  placeholder="Limited"
                  {...register("trim")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="text"
                  placeholder="World Rally Blue"
                  {...register("color")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                type="text"
                placeholder="JF1VA2U68L9823456"
                maxLength={17}
                className="font-mono"
                {...register("vin")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  aria-invalid={!!fieldError("purchaseDate")}
                  {...register("purchaseDate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25000"
                  aria-invalid={!!fieldError("purchasePrice")}
                  {...register("purchasePrice", { valueAsNumber: true })}
                />
                {fieldError("purchasePrice") && (
                  <p className="text-xs text-destructive">
                    {fieldError("purchasePrice")}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currentOdometer">Current Odometer (mi)</Label>
                <Input
                  id="currentOdometer"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="45000"
                  aria-invalid={!!fieldError("currentOdometer")}
                  {...register("currentOdometer", { valueAsNumber: true })}
                />
                {fieldError("currentOdometer") && (
                  <p className="text-xs text-destructive">
                    {fieldError("currentOdometer")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="primaryUse">Primary Use</Label>
                {/* Hidden input carries the Select value into FormData */}
                <input
                  type="hidden"
                  name="primaryUse"
                  value={primaryUseValue ?? ""}
                />
                <Select
                  value={primaryUseValue ?? ""}
                  onValueChange={(v) =>
                    setValue("primaryUse", v as CarFormInput["primaryUse"])
                  }
                >
                  <SelectTrigger id="primaryUse" className="w-full">
                    <SelectValue placeholder="Select use" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_USE_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about the car..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </div>
        )}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : car ? "Save Changes" : "Add Car"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
