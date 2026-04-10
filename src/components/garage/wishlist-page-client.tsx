"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WishlistForm } from "@/components/garage/wishlist-form";
import { WishlistList } from "@/components/garage/wishlist-list";
import { createWishlistItem } from "@/lib/actions/wishlist";
import type { WishlistItem } from "@prisma/client";

interface WishlistPageClientProps {
  items: WishlistItem[];
  estimatedTotal: number;
  highCount: number;
  medCount: number;
  lowCount: number;
  carId: string;
}

export function WishlistPageClient({
  items,
  estimatedTotal,
  highCount,
  medCount,
  lowCount,
  carId,
}: WishlistPageClientProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Item
        </Button>
      </div>

      {items.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{items.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length === 1 ? "Item" : "Items"}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-500">{highCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                High priority
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-yellow-500">
                {medCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Medium priority
              </p>
            </div>
            {estimatedTotal > 0 ? (
              <div>
                <p className="text-2xl font-semibold">
                  ~$
                  {estimatedTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimated total
                </p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-semibold">{lowCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Low priority
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <WishlistList items={items} carId={carId} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Wishlist Item</DialogTitle>
          </DialogHeader>
          <WishlistForm
            action={createWishlistItem}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
