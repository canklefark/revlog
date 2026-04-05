"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PencilIcon,
  Trash2Icon,
  ArrowRightIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteWishlistItem,
  moveWishlistToMod,
  type WishlistActionState,
} from "@/lib/actions/wishlist";
import { groupByKey } from "@/lib/utils/group-by";
import type { WishlistItem } from "@prisma/client";

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-yellow-500",
  Low: "text-muted-foreground",
};

const initialState: WishlistActionState = {};

function DeleteWishlistForm({ itemId }: { itemId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteWishlistItem,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Item removed from wishlist");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Remove from wishlist"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="itemId" value={itemId} />
            <AlertDialogAction
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MoveToModsForm({ itemId }: { itemId: string }) {
  const [state, formAction, isPending] = useActionState(
    moveWishlistToMod,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Moved to Modifications");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="text-xs h-7 gap-1"
      >
        <ArrowRightIcon className="size-3" />
        {isPending ? "Moving..." : "Move to Mods"}
      </Button>
    </form>
  );
}

interface WishlistListProps {
  items: WishlistItem[];
  carId: string;
}

export function WishlistList({ items, carId }: WishlistListProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No wishlist items yet.</p>
        <p className="text-xs mt-1">
          Add items you want to install on this car.
        </p>
      </div>
    );
  }

  const availableCategories = Array.from(
    new Set(items.map((i) => i.category ?? "Uncategorized")),
  ).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  const availablePriorities = Array.from(
    new Set(items.map((i) => i.priority)),
  ).sort();

  const filteredItems = items.filter((item) => {
    const catMatch =
      categoryFilter === "all" ||
      (item.category ?? "Uncategorized") === categoryFilter;
    const priMatch =
      priorityFilter === "all" || item.priority === priorityFilter;
    return catMatch && priMatch;
  });

  const grouped = groupByKey(filteredItems, (i) => i.category);
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {availablePriorities.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No items match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category, idx) => (
            <div key={category}>
              {idx > 0 && <Separator className="mb-6" />}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{category}</h2>
                <Badge variant="secondary" className="text-xs">
                  {grouped[category].length}
                </Badge>
              </div>
              <div className="space-y-3">
                {grouped[category].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{item.name}</p>
                          <span
                            className={`text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? "text-muted-foreground"}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.estimatedCost != null && (
                            <span className="text-xs text-muted-foreground">
                              ~$
                              {item.estimatedCost.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline underline-offset-4"
                            >
                              Source <ExternalLinkIcon className="size-3" />
                            </a>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          aria-label="Edit wishlist item"
                        >
                          <Link
                            href={`/garage/${carId}/wishlist/${item.id}/edit`}
                          >
                            <PencilIcon className="size-4" />
                          </Link>
                        </Button>
                        <DeleteWishlistForm itemId={item.id} />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                      <MoveToModsForm itemId={item.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
