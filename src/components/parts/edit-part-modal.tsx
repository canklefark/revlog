"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updatePart, type PartActionState } from "@/lib/actions/part";
import { MOD_CATEGORIES } from "@/lib/constants/mod-categories";
import type { PartWithCar } from "@/lib/queries/parts";

interface EditPartModalProps {
  part: PartWithCar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: PartActionState = {};

function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function EditPartModal({
  part,
  open,
  onOpenChange,
}: EditPartModalProps) {
  const [state, formAction, isPending] = useActionState(
    updatePart,
    initialState,
  );
  const [isWishlist, setIsWishlist] = useState(part.status === "wishlist");
  const [category, setCategory] = useState(part.category ?? "none");

  // Reset local state when the modal opens with a (potentially different) part
  useEffect(() => {
    if (open) {
      setIsWishlist(part.status === "wishlist");
      setCategory(part.category ?? "none");
    }
  }, [open, part.status, part.category]);

  useEffect(() => {
    if (state.data && state.data !== true) {
      toast.success("Part updated");
      onOpenChange(false);
    }
    if (state.error) toast.error(state.error);
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the details for this part.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="partId" value={part.id} />
          <input
            type="hidden"
            name="status"
            value={
              isWishlist
                ? "wishlist"
                : part.status === "wishlist"
                  ? "stock"
                  : part.status
            }
          />
          <input
            type="hidden"
            name="category"
            value={category === "none" ? "" : category}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Part Name */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-name">
                Part Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={part.name}
                placeholder="Part name"
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>

            {/* Manufacturer */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                name="manufacturer"
                defaultValue={part.manufacturer ?? ""}
                placeholder="Brand"
              />
            </div>

            {/* Part Number */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-number">Part Number</Label>
              <Input
                id="edit-part-number"
                name="partNumber"
                defaultValue={part.partNumber ?? ""}
                placeholder="OEM or aftermarket number"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {MOD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Link */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-product-link">Product Link</Label>
              <Input
                id="edit-product-link"
                name="productLink"
                type="url"
                defaultValue={part.productLink ?? ""}
                placeholder="https://"
              />
              {state.fieldErrors?.productLink && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.productLink[0]}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={part.description ?? ""}
                placeholder="What this part does or why you want it..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">Purchase Information</p>

            {/* Wishlist toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <Switch
                id="edit-wishlist-toggle"
                checked={isWishlist}
                onCheckedChange={setIsWishlist}
                className="mt-0.5 shrink-0"
              />
              <div>
                <Label
                  htmlFor="edit-wishlist-toggle"
                  className="cursor-pointer font-medium text-sm"
                >
                  Wish-list item
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Not yet purchased — stays in your wish list until bought.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={part.price ?? 0}
                    className="pl-6"
                  />
                </div>
              </div>

              {/* Purchase Date */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                <Input
                  id="edit-purchase-date"
                  name="purchaseDate"
                  type="date"
                  defaultValue={toDateInput(part.purchaseDate)}
                />
              </div>

              {/* Vendor */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-vendor">Vendor</Label>
                <Input
                  id="edit-vendor"
                  name="vendor"
                  defaultValue={part.vendor ?? ""}
                  placeholder="Where you bought it"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue={part.quantity}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                defaultValue={part.notes ?? ""}
                placeholder="Condition, fitment notes, install tips..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
