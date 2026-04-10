"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
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
import {
  BRAKE_POSITIONS,
  type BrakePosition,
} from "@/lib/constants/brake-positions";
import { TIRE_STATUSES, type TireStatus } from "@/lib/constants/tire-statuses";
import type { BrakeSetActionState } from "@/lib/actions/brake-set";
import type { BrakeSet } from "@prisma/client";

interface BrakeSetFormProps {
  action: (
    prevState: BrakeSetActionState,
    formData: FormData,
  ) => Promise<BrakeSetActionState>;
  carId: string;
  defaultValues?: Partial<BrakeSet>;
}

const initialState: BrakeSetActionState = {};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function BrakeSetForm({
  action,
  carId,
  defaultValues,
}: BrakeSetFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [position, setPosition] = useState<BrakePosition | "">(
    (defaultValues?.position as BrakePosition) ?? "",
  );
  const [status, setStatus] = useState<TireStatus>(
    (defaultValues?.status as TireStatus) ?? "Active",
  );

  useEffect(() => {
    if (state.data) {
      toast.success(
        defaultValues?.id ? "Brake set updated" : "Brake set added",
      );
      router.push(`/garage/${carId}/brakes`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="brakeSetId" value={defaultValues.id} />
      )}
      <input type="hidden" name="position" value={position} />
      <input type="hidden" name="status" value={status} />

      <div className="space-y-1.5">
        <Label htmlFor="position">Position *</Label>
        <Select
          value={position}
          onValueChange={(v) => setPosition(v as BrakePosition)}
        >
          <SelectTrigger id="position" className="w-full">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {BRAKE_POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("position") && (
          <p className="text-xs text-destructive">{fieldError("position")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as TireStatus)}
        >
          <SelectTrigger id="status" className="w-full">
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
        {fieldError("status") && (
          <p className="text-xs text-destructive">{fieldError("status")}</p>
        )}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Pad Details
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="padBrand">Pad Brand</Label>
          <Input
            id="padBrand"
            name="padBrand"
            type="text"
            placeholder="e.g. Hawk"
            defaultValue={defaultValues?.padBrand ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="padCompound">Pad Compound</Label>
          <Input
            id="padCompound"
            name="padCompound"
            type="text"
            placeholder="e.g. HP Plus"
            defaultValue={defaultValues?.padCompound ?? ""}
          />
        </div>
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Rotor Details
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="rotorBrand">Rotor Brand</Label>
        <Input
          id="rotorBrand"
          name="rotorBrand"
          type="text"
          placeholder="e.g. Stoptech"
          defaultValue={defaultValues?.rotorBrand ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rotorNotes">Rotor Notes</Label>
        <Textarea
          id="rotorNotes"
          name="rotorNotes"
          placeholder="Slotted, drilled, size, etc."
          rows={2}
          defaultValue={defaultValues?.rotorNotes ?? ""}
        />
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Condition &amp; Cost
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="wearRemaining">Wear Remaining (%)</Label>
        <div className="relative">
          <Input
            id="wearRemaining"
            name="wearRemaining"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="e.g. 75"
            defaultValue={defaultValues?.wearRemaining ?? ""}
            aria-invalid={!!fieldError("wearRemaining")}
            className="pr-8"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
        {fieldError("wearRemaining") && (
          <p className="text-xs text-destructive">
            {fieldError("wearRemaining")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={formatDateForInput(defaultValues?.purchaseDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost">Cost ($)</Label>
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any notes about this brake set..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Brake Set"}
      </Button>
    </form>
  );
}
