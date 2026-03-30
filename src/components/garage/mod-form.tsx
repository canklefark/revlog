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
  MOD_CATEGORIES,
  INSTALLED_BY_OPTIONS,
  type ModCategory,
  type InstalledBy,
} from "@/lib/constants/mod-categories";
import type { ModActionState } from "@/lib/actions/mod";
import type { Mod } from "@prisma/client";

interface ModFormProps {
  action: (
    prevState: ModActionState,
    formData: FormData,
  ) => Promise<ModActionState>;
  carId: string;
  defaultValues?: Partial<Mod>;
}

const initialState: ModActionState = {};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function ModForm({ action, carId, defaultValues }: ModFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [category, setCategory] = useState<ModCategory | "">(
    (defaultValues?.category as ModCategory) ?? "",
  );
  const [installedBy, setInstalledBy] = useState<InstalledBy | "">(
    (defaultValues?.installedBy as InstalledBy) ?? "",
  );

  useEffect(() => {
    if (state.data) {
      toast.success(
        defaultValues?.id ? "Modification updated" : "Modification added",
      );
      router.push(`/garage/${carId}/mods`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && <input type="hidden" name="modId" value={defaultValues.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="installedBy" value={installedBy} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Coilover kit"
          required
          defaultValue={defaultValues?.name ?? ""}
          aria-invalid={!!fieldError("name")}
        />
        {fieldError("name") && (
          <p className="text-xs text-destructive">{fieldError("name")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ModCategory)}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {MOD_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("category") && (
          <p className="text-xs text-destructive">{fieldError("category")}</p>
        )}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Optional Details
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            type="text"
            placeholder="e.g. Öhlins"
            defaultValue={defaultValues?.brand ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partNumber">Part Number</Label>
          <Input
            id="partNumber"
            name="partNumber"
            type="text"
            placeholder="e.g. MSD100-123"
            defaultValue={defaultValues?.partNumber ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installDate">Install Date</Label>
        <Input
          id="installDate"
          name="installDate"
          type="date"
          defaultValue={formatDateForInput(defaultValues?.installDate)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installedBy">Installed By</Label>
        <Select
          value={installedBy}
          onValueChange={(v) => setInstalledBy(v as InstalledBy)}
        >
          <SelectTrigger id="installedBy" className="w-full">
            <SelectValue placeholder="Self or shop?" />
          </SelectTrigger>
          <SelectContent>
            {INSTALLED_BY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {installedBy === "Shop" && (
        <div className="space-y-1.5">
          <Label htmlFor="shopName">Shop Name *</Label>
          <Input
            id="shopName"
            name="shopName"
            type="text"
            placeholder="e.g. Speed Shop"
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
          <Label htmlFor="odometerAtInstall">Odometer at Install (mi)</Label>
          <Input
            id="odometerAtInstall"
            name="odometerAtInstall"
            type="number"
            min="0"
            step="1"
            placeholder="45000"
            defaultValue={defaultValues?.odometerAtInstall ?? ""}
            aria-invalid={!!fieldError("odometerAtInstall")}
          />
          {fieldError("odometerAtInstall") && (
            <p className="text-xs text-destructive">
              {fieldError("odometerAtInstall")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any notes about this mod..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Modification"}
      </Button>
    </form>
  );
}
