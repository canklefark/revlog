"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
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
import { createPart, type PartActionState } from "@/lib/actions/part";
import { MOD_CATEGORIES } from "@/lib/constants/mod-categories";

interface AddPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
}

const initialState: PartActionState = {};

export function AddPartModal({ open, onOpenChange, carId }: AddPartModalProps) {
  const [state, formAction, isPending] = useActionState(
    createPart,
    initialState,
  );
  const [isWishlist, setIsWishlist] = useState(false);
  const [category, setCategory] = useState("none");

  useEffect(() => {
    if (state.data && state.data !== true) {
      toast.success("Part added to inventory");
      onOpenChange(false);
      setIsWishlist(false);
      setCategory("none");
    }
    if (state.error) toast.error(state.error);
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Part</DialogTitle>
          <DialogDescription>
            Add a new part to your inventory.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="carId" value={carId} />
          <input
            type="hidden"
            name="status"
            value={isWishlist ? "wishlist" : "stock"}
          />
          <input
            type="hidden"
            name="category"
            value={category === "none" ? "" : category}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Part Name */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="part-name">
                Part Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="part-name"
                name="name"
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
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                placeholder="Brand"
              />
            </div>

            {/* Part Number */}
            <div className="space-y-1.5">
              <Label htmlFor="part-number">Part Number</Label>
              <Input
                id="part-number"
                name="partNumber"
                placeholder="OEM or aftermarket number"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="product-link">Product Link</Label>
              <Input
                id="product-link"
                name="productLink"
                type="url"
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What this part does or why you want it..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Purchase Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium">
              Purchase Information (Optional)
            </p>

            {/* Wishlist toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <Switch
                id="wishlist-toggle"
                checked={isWishlist}
                onCheckedChange={setIsWishlist}
                className="mt-0.5 shrink-0"
              />
              <div>
                <Label
                  htmlFor="wishlist-toggle"
                  className="cursor-pointer font-medium text-sm"
                >
                  Add as wish-list item
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Not yet purchased — stays in your wish list until bought.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0.00"
                    className="pl-6"
                  />
                </div>
              </div>

              {/* Purchase Date */}
              <div className="space-y-1.5">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input id="purchase-date" name="purchaseDate" type="date" />
              </div>

              {/* Vendor */}
              <div className="space-y-1.5">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  placeholder="Where you bought it"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
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
              <PlusIcon className="size-4 mr-1" />
              {isPending ? "Adding..." : "Add Part"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
