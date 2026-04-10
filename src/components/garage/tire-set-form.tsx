"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

const initialState: TireSetActionState = {};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function TireSetForm({
  action,
  carId,
  defaultValues,
}: TireSetFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [status, setStatus] = useState<TireStatus>(
    (defaultValues?.status as TireStatus) ?? "Active",
  );

  useEffect(() => {
    if (state.data) {
      toast.success(defaultValues?.id ? "Tire set updated" : "Tire set added");
      router.push(`/garage/${carId}/tires`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="tireSetId" value={defaultValues.id} />
      )}
      <input type="hidden" name="status" value={status} />

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

      <div className="space-y-1.5">
        <Label htmlFor="size">Size *</Label>
        <Input
          id="size"
          name="size"
          type="text"
          placeholder="e.g. 245/40R17"
          required
          defaultValue={defaultValues?.size ?? ""}
          aria-invalid={!!fieldError("size")}
        />
        {fieldError("size") && (
          <p className="text-xs text-destructive">{fieldError("size")}</p>
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
        Optional Details
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="compound">Compound</Label>
        <Input
          id="compound"
          name="compound"
          type="text"
          placeholder="e.g. Ultra High Performance"
          defaultValue={defaultValues?.compound ?? ""}
        />
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
          placeholder="Any notes about this tire set..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Tire Set"}
      </Button>
    </form>
  );
}
