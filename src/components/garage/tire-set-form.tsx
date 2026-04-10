"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TireSizeInput } from "@/components/garage/tire-size-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TIRE_STATUSES, type TireStatus } from "@/lib/constants/tire-statuses";
import type { TireSetActionState } from "@/lib/actions/tire-set";
import type { TireSet } from "@prisma/client";

interface TireSetFormProps {
  action: (
    prevState: TireSetActionState,
    formData: FormData,
  ) => Promise<TireSetActionState>;
  carId: string;
  defaultValues?: Partial<TireSet>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type QuantityType = "front-pair" | "rear-pair" | "set-of-4";

const initialState: TireSetActionState = {};

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <Separator />
    </div>
  );
}

interface RadioOptionProps {
  name: string;
  value: string;
  currentValue: string;
  onChange: (v: string) => void;
  label: string;
}

function RadioOption({
  name,
  value,
  currentValue,
  onChange,
  label,
}: RadioOptionProps) {
  const isSelected = currentValue === value;
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={cn(
          "size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          isSelected ? "border-primary" : "border-muted-foreground",
        )}
      >
        {isSelected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function TireSetForm({
  action,
  carId,
  defaultValues,
  onSuccess,
  onCancel,
}: TireSetFormProps) {
  const isEdit = !!defaultValues?.id;

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Derive initial quantity type from defaultValues.quantity
  const initQuantityType = (): QuantityType => {
    if (!defaultValues?.quantity) return "set-of-4";
    if (defaultValues.quantity === 2) return "front-pair";
    return "set-of-4";
  };

  const [quantityType, setQuantityType] =
    useState<QuantityType>(initQuantityType);
  const [isStaggered, setIsStaggered] = useState<boolean>(
    !!defaultValues?.rearSize,
  );
  const [mountImmediately, setMountImmediately] = useState<boolean>(
    isEdit ? defaultValues?.status === "Active" : true,
  );
  const [editStatus, setEditStatus] = useState<TireStatus>(
    (defaultValues?.status as TireStatus) ?? "Active",
  );

  const quantity = quantityType === "set-of-4" ? 4 : 2;

  const derivedStatus = isEdit
    ? editStatus
    : mountImmediately
      ? "Active"
      : "Stored";

  useEffect(() => {
    if (state.data) {
      toast.success(isEdit ? "Tire set updated" : "Tire set added");
      onSuccess?.();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const submitLabel = isEdit
    ? "Save Changes"
    : quantity === 2
      ? "Add 2 Tires"
      : "Add 4 Tires";

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden system inputs */}
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="tireSetId" value={defaultValues.id} />
      )}
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="status" value={derivedStatus} />

      {/* QUANTITY */}
      <SectionHeader label="Quantity" />
      <div className="flex flex-wrap gap-4">
        <RadioOption
          name="quantityType"
          value="front-pair"
          currentValue={quantityType}
          onChange={(v) => setQuantityType(v as QuantityType)}
          label="Front Pair (2)"
        />
        <RadioOption
          name="quantityType"
          value="rear-pair"
          currentValue={quantityType}
          onChange={(v) => setQuantityType(v as QuantityType)}
          label="Rear Pair (2)"
        />
        <RadioOption
          name="quantityType"
          value="set-of-4"
          currentValue={quantityType}
          onChange={(v) => setQuantityType(v as QuantityType)}
          label="Set of 4"
        />
      </div>

      {/* SETUP TYPE */}
      <SectionHeader label="Setup Type" />
      <div className="flex gap-4">
        <RadioOption
          name="setupType"
          value="square"
          currentValue={isStaggered ? "staggered" : "square"}
          onChange={() => setIsStaggered(false)}
          label="Square"
        />
        <RadioOption
          name="setupType"
          value="staggered"
          currentValue={isStaggered ? "staggered" : "square"}
          onChange={() => setIsStaggered(true)}
          label="Staggered"
        />
      </div>

      {/* Brand + Model */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            name="brand"
            type="text"
            placeholder="e.g. Bridgestone"
            required
            defaultValue={defaultValues?.brand ?? ""}
            aria-invalid={!!fieldError("brand")}
          />
          {fieldError("brand") && (
            <p className="text-xs text-destructive">{fieldError("brand")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            name="model"
            type="text"
            placeholder="e.g. RE-71RS"
            required
            defaultValue={defaultValues?.model ?? ""}
            aria-invalid={!!fieldError("model")}
          />
          {fieldError("model") && (
            <p className="text-xs text-destructive">{fieldError("model")}</p>
          )}
        </div>
      </div>

      {/* Tire Size */}
      <div
        className={cn(
          "grid gap-4",
          isStaggered ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        <div className="space-y-1.5">
          <Label htmlFor="frontSize">
            {isStaggered ? "Front Tire Size *" : "Tire Size *"}
          </Label>
          <TireSizeInput
            id="frontSize"
            name="frontSize"
            defaultValue={defaultValues?.frontSize ?? ""}
            aria-invalid={!!fieldError("frontSize")}
          />
          {fieldError("frontSize") && (
            <p className="text-xs text-destructive">
              {fieldError("frontSize")}
            </p>
          )}
        </div>
        {isStaggered && (
          <div className="space-y-1.5">
            <Label htmlFor="rearSize">Rear Tire Size *</Label>
            <TireSizeInput
              id="rearSize"
              name="rearSize"
              defaultValue={defaultValues?.rearSize ?? ""}
              aria-invalid={!!fieldError("rearSize")}
            />
            {fieldError("rearSize") && (
              <p className="text-xs text-destructive">
                {fieldError("rearSize")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* OPTIONAL DETAILS */}
      <SectionHeader label="Optional Details" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dotCode">DOT Date Code</Label>
          <Input
            id="dotCode"
            name="dotCode"
            type="text"
            maxLength={4}
            placeholder="2423"
            defaultValue={defaultValues?.dotCode ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Week + Year (e.g., 2423)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxHeatCycles">Max Heat Cycles</Label>
          <Input
            id="maxHeatCycles"
            name="maxHeatCycles"
            type="number"
            min="0"
            step="1"
            placeholder="10"
            defaultValue={defaultValues?.maxHeatCycles ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            e.g., 8–10 for RE-71RS
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost">
            {isStaggered ? "Front Price ($)" : "Price ($)"}
          </Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.cost ?? ""}
            aria-invalid={!!fieldError("cost")}
          />
          {fieldError("cost") && (
            <p className="text-xs text-destructive">{fieldError("cost")}</p>
          )}
        </div>
        {isStaggered && (
          <div className="space-y-1.5">
            <Label htmlFor="rearCost">Rear Price ($)</Label>
            <Input
              id="rearCost"
              name="rearCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={defaultValues?.rearCost ?? ""}
              aria-invalid={!!fieldError("rearCost")}
            />
            {fieldError("rearCost") && (
              <p className="text-xs text-destructive">
                {fieldError("rearCost")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* INSTALLATION */}
      {!isEdit && (
        <>
          <SectionHeader label="Installation" />
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="mountImmediately"
                checked={mountImmediately}
                onCheckedChange={(checked) =>
                  setMountImmediately(checked === true)
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="mountImmediately" className="cursor-pointer">
                  Mount immediately
                </Label>
                <p className="text-xs text-muted-foreground">
                  Install these tires on the car right away
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit-mode status select */}
      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="editStatus">Status</Label>
          <Select
            value={editStatus}
            onValueChange={(v) => setEditStatus(v as TireStatus)}
          >
            <SelectTrigger id="editStatus" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {TIRE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
