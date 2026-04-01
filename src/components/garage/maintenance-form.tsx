"use client";

import { useActionState, useEffect, useState } from "react";
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
  SERVICE_TYPES,
  PERFORMED_BY_OPTIONS,
  type ServiceType,
  type PerformedBy,
} from "@/lib/constants/maintenance-types";
import type { MaintenanceActionState } from "@/lib/actions/maintenance";
import type { MaintenanceEntry } from "@prisma/client";

interface MaintenanceFormProps {
  action: (
    prevState: MaintenanceActionState,
    formData: FormData,
  ) => Promise<MaintenanceActionState>;
  carId: string;
  defaultValues?: Partial<MaintenanceEntry>;
  defaultServiceType?: string;
}

const initialState: MaintenanceActionState = {};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function MaintenanceForm({
  action,
  carId,
  defaultValues,
  defaultServiceType,
}: MaintenanceFormProps) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state) return;
    if (state.error) toast.error(state.error);
    if (state.data) {
      toast.success(isEdit ? "Entry updated." : "Entry added.");
      router.push(`/garage/${carId}/maintenance`);
    }
  }, [state, isEdit, carId, router]);

  const initialServiceType = (defaultValues?.serviceType ??
    defaultServiceType ??
    "") as ServiceType | "";
  const initialPerformedBy = (defaultValues?.performedBy ?? "") as
    | PerformedBy
    | "";

  const [serviceType, setServiceType] = useState<ServiceType | "">(
    initialServiceType,
  );
  const [performedBy, setPerformedBy] = useState<PerformedBy | "">(
    initialPerformedBy,
  );

  const fieldError = (field: string): string | undefined => {
    const server = state.fieldErrors?.[field];
    if (server?.length) return server[0];
    return undefined;
  };

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden fields */}
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="entryId" value={defaultValues.id} />
      )}
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="performedBy" value={performedBy} />

      {/* --- Required fields --- */}
      <div className="space-y-1.5">
        <Label htmlFor="serviceType">Service Type *</Label>
        <Select
          value={serviceType}
          onValueChange={(v) => setServiceType(v as ServiceType)}
        >
          <SelectTrigger id="serviceType" className="w-full">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("serviceType") && (
          <p className="text-xs text-destructive">
            {fieldError("serviceType")}
          </p>
        )}
      </div>

      {serviceType === "Custom" && (
        <div className="space-y-1.5">
          <Label htmlFor="customServiceName">Custom Service Name *</Label>
          <Input
            id="customServiceName"
            name="customServiceName"
            type="text"
            placeholder="Describe the service..."
            defaultValue={defaultValues?.customServiceName ?? ""}
            aria-invalid={!!fieldError("customServiceName")}
          />
          {fieldError("customServiceName") && (
            <p className="text-xs text-destructive">
              {fieldError("customServiceName")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="date">Date Performed *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={formatDateForInput(defaultValues?.date)}
          aria-invalid={!!fieldError("date")}
        />
        {fieldError("date") && (
          <p className="text-xs text-destructive">{fieldError("date")}</p>
        )}
      </div>

      <Separator />

      {/* --- Optional fields --- */}
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Optional Details
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="odometer">Odometer at Service (mi)</Label>
        <Input
          id="odometer"
          name="odometer"
          type="number"
          min="0"
          step="1"
          placeholder="45000"
          defaultValue={defaultValues?.odometer ?? ""}
          aria-invalid={!!fieldError("odometer")}
        />
        {fieldError("odometer") && (
          <p className="text-xs text-destructive">{fieldError("odometer")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="performedBy">Performed By</Label>
        <Select
          value={performedBy}
          onValueChange={(v) => setPerformedBy(v as PerformedBy)}
        >
          <SelectTrigger id="performedBy" className="w-full">
            <SelectValue placeholder="Self or shop?" />
          </SelectTrigger>
          <SelectContent>
            {PERFORMED_BY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {performedBy === "Shop" && (
        <div className="space-y-1.5">
          <Label htmlFor="shopName">Shop Name *</Label>
          <Input
            id="shopName"
            name="shopName"
            type="text"
            placeholder="Quick Lube Plus"
            defaultValue={defaultValues?.shopName ?? ""}
            aria-invalid={!!fieldError("shopName")}
          />
          {fieldError("shopName") && (
            <p className="text-xs text-destructive">{fieldError("shopName")}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="productBrand">Product Brand</Label>
          <Input
            id="productBrand"
            name="productBrand"
            type="text"
            placeholder="Mobil 1"
            defaultValue={defaultValues?.productBrand ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="productSpec">Product Spec / Weight</Label>
          <Input
            id="productSpec"
            name="productSpec"
            type="text"
            placeholder="5W-30"
            defaultValue={defaultValues?.productSpec ?? ""}
          />
        </div>
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

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any notes about this service..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Next Due
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nextDueDate">Next Due Date</Label>
          <Input
            id="nextDueDate"
            name="nextDueDate"
            type="date"
            defaultValue={formatDateForInput(defaultValues?.nextDueDate)}
            aria-invalid={!!fieldError("nextDueDate")}
          />
          {fieldError("nextDueDate") && (
            <p className="text-xs text-destructive">
              {fieldError("nextDueDate")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextDueMileage">Next Due Mileage</Label>
          <Input
            id="nextDueMileage"
            name="nextDueMileage"
            type="number"
            min="0"
            step="1"
            placeholder="50000"
            defaultValue={defaultValues?.nextDueMileage ?? ""}
            aria-invalid={!!fieldError("nextDueMileage")}
          />
          {fieldError("nextDueMileage") && (
            <p className="text-xs text-destructive">
              {fieldError("nextDueMileage")}
            </p>
          )}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Entry"}
      </Button>
    </form>
  );
}
