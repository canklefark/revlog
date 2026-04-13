"use client";

import { useState, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AddPartModal } from "./add-part-modal";
import { EditPartModal } from "./edit-part-modal";
import type { PartWithCar } from "@/lib/queries/parts";
import {
  PART_STATUS_LABELS,
  type PartStatus,
} from "@/lib/constants/part-statuses";
import { MOD_CATEGORIES } from "@/lib/constants/mod-categories";
import {
  deletePart,
  updatePartStatus,
  type PartActionState,
} from "@/lib/actions/part";

interface PartsPageClientProps {
  parts: PartWithCar[];
  carId: string;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "installed", label: "Installed" },
  { key: "stock", label: "Stock" },
  { key: "wishlist", label: "Wish List" },
  { key: "archived", label: "Archived" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_BADGE: Record<PartStatus, string> = {
  wishlist: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  stock: "bg-muted text-muted-foreground border-border",
  installed: "bg-primary/15 text-primary border-primary/20",
  archived: "bg-muted/50 text-muted-foreground/60 border-border/50",
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const deleteInitial: PartActionState = {};
const statusInitial: PartActionState = {};

function RowActions({ part }: { part: PartWithCar }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteState, deleteFormAction, deleteIsPending] = useActionState(
    deletePart,
    deleteInitial,
  );

  useEffect(() => {
    if (deleteState.data) {
      toast.success("Part deleted");
      setDeleteOpen(false);
    }
    if (deleteState.error) toast.error(deleteState.error);
  }, [deleteState]);

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => setEditOpen(true)}
        aria-label="Edit part"
      >
        <PencilIcon className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
        aria-label="Delete part"
      >
        <Trash2Icon className="size-3.5" />
      </Button>

      <EditPartModal part={part} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{part.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This will permanently remove this part from your inventory. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={deleteFormAction}>
              <input type="hidden" name="partId" value={part.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteIsPending}
              >
                {deleteIsPending ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusChanger({ part }: { part: PartWithCar }) {
  const [state, formAction, isPending] = useActionState(
    updatePartStatus,
    statusInitial,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const nextStatus: Record<PartStatus, PartStatus> = {
    wishlist: "stock",
    stock: "installed",
    installed: "archived",
    archived: "stock",
  };

  const next = nextStatus[part.status as PartStatus] ?? "stock";

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="partId" value={part.id} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer"
        title={`Click to mark as ${PART_STATUS_LABELS[next]}`}
      >
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity",
            STATUS_BADGE[part.status as PartStatus] ?? STATUS_BADGE.stock,
            isPending && "opacity-50",
          )}
        >
          {PART_STATUS_LABELS[part.status as PartStatus] ?? part.status}
        </span>
      </button>
    </form>
  );
}

export function PartsPageClient({ parts, carId }: PartsPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [showTires, setShowTires] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filtered = parts
    .filter((p) => {
      if (activeTab !== "all" && p.status !== activeTab) return false;
      if (!showTires && p.category === "Wheels & Tires") return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.manufacturer?.toLowerCase().includes(q) ?? false) ||
          (p.partNumber?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "cost") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "date")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return 0;
    });

  function tabCount(key: TabKey) {
    if (key === "all") return parts.length;
    return parts.filter((p) => p.status === key).length;
  }

  return (
    <main className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Parts Inventory</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <PlusIcon className="size-3.5 mr-1.5" />
            Add Part
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-0 border-b border-border mb-5 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              activeTab === key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}{" "}
            <span className="text-muted-foreground font-normal">
              ({tabCount(key)})
            </span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-auto min-w-[140px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category: All</SelectItem>
            {MOD_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="cost">Sort: Cost</SelectItem>
            <SelectItem value="date">Sort: Date Added</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showTires ? "default" : "outline"}
          size="sm"
          className="h-8 text-sm"
          onClick={() => setShowTires((v) => !v)}
        >
          Show Tires
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Part
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                Installed
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cost
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  {parts.length === 0 ? (
                    <>
                      No parts found.{" "}
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="text-primary underline-offset-4 hover:underline cursor-pointer"
                      >
                        Add your first part
                      </button>{" "}
                      to start tracking your inventory.
                    </>
                  ) : (
                    "No parts match your filters."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((part, idx) => (
                <tr
                  key={part.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                    idx % 2 === 0 ? "" : "bg-muted/5",
                  )}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{part.name}</p>
                      {(part.manufacturer || part.partNumber) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[part.manufacturer, part.partNumber]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {part.category ? (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {part.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChanger part={part} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {part.installedAt
                      ? new Date(part.installedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(part.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {part.quantity}
                  </td>
                  <td className="px-2 py-3">
                    <RowActions part={part} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPartModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        carId={carId}
      />
    </main>
  );
}
