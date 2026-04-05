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
  type ModCategory,
} from "@/lib/constants/mod-categories";
import {
  WISHLIST_PRIORITIES,
  type WishlistPriority,
} from "@/lib/constants/wishlist-priorities";
import type { WishlistActionState } from "@/lib/actions/wishlist";
import type { WishlistItem } from "@prisma/client";

interface WishlistFormProps {
  action: (
    prevState: WishlistActionState,
    formData: FormData,
  ) => Promise<WishlistActionState>;
  carId: string;
  defaultValues?: Partial<WishlistItem>;
}

const initialState: WishlistActionState = {};

export function WishlistForm({
  action,
  carId,
  defaultValues,
}: WishlistFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [category, setCategory] = useState<ModCategory | "">(
    (defaultValues?.category as ModCategory) ?? "",
  );
  const [priority, setPriority] = useState<WishlistPriority>(
    (defaultValues?.priority as WishlistPriority) ?? "Medium",
  );

  useEffect(() => {
    if (state.data) {
      toast.success(
        defaultValues?.id ? "Item updated" : "Item added to wishlist",
      );
      router.push(`/garage/${carId}/wishlist`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && <input type="hidden" name="itemId" value={defaultValues.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="priority" value={priority} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Brake upgrade kit"
          required
          defaultValue={defaultValues?.name ?? ""}
          aria-invalid={!!fieldError("name")}
        />
        {fieldError("name") && (
          <p className="text-xs text-destructive">{fieldError("name")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          name="brand"
          type="text"
          placeholder="e.g. Wilwood, Hawk, OEM"
          defaultValue={defaultValues?.brand ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={priority}
          onValueChange={(v) => setPriority(v as WishlistPriority)}
        >
          <SelectTrigger id="priority" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WISHLIST_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Optional Details
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
        <Input
          id="estimatedCost"
          name="estimatedCost"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          defaultValue={defaultValues?.estimatedCost ?? ""}
          aria-invalid={!!fieldError("estimatedCost")}
        />
        {fieldError("estimatedCost") && (
          <p className="text-xs text-destructive">
            {fieldError("estimatedCost")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourceUrl">Source URL</Label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.sourceUrl ?? ""}
          aria-invalid={!!fieldError("sourceUrl")}
        />
        {fieldError("sourceUrl") && (
          <p className="text-xs text-destructive">{fieldError("sourceUrl")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Why do you want this? Any notes..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add to Wishlist"}
      </Button>
    </form>
  );
}
