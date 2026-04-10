"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PencilIcon,
  Trash2Icon,
  MoreVerticalIcon,
  GaugeIcon,
  FlameIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  deleteTireSet,
  updateTireSet,
  type TireSetActionState,
} from "@/lib/actions/tire-set";
import { TreadDepthForm } from "@/components/garage/tread-depth-form";
import { TireSetForm } from "@/components/garage/tire-set-form";
import type { TireSetWithLogs, GroupedTireSets } from "@/lib/queries/tire-sets";

interface TireSetListProps extends GroupedTireSets {
  carId: string;
}

const deleteInitialState: TireSetActionState = {};

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Active") return "default";
  if (status === "Stored") return "secondary";
  return "outline";
}

function DeleteTireSetDialog({ tireSetId }: { tireSetId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteTireSet,
    deleteInitialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) toast.success("Tire set deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <DropdownMenuItem
        onSelect={() => setConfirmOpen(true)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2Icon className="size-4 mr-2" />
        Delete
      </DropdownMenuItem>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tire set?</DialogTitle>
            <DialogDescription>
              This will permanently delete the tire set and all tread depth
              readings. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="tireSetId" value={tireSetId} />
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TireSetCard({
  tireSet,
  carId,
}: {
  tireSet: TireSetWithLogs;
  carId: string;
}) {
  const [treadSheetOpen, setTreadSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const latestDepth = tireSet.treadDepthLogs[0];

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <Link
          href={`/garage/${carId}/tires/${tireSet.id}`}
          className="min-w-0 flex-1 group"
        >
          <p className="font-medium text-sm group-hover:text-primary transition-colors">
            {tireSet.brand} {tireSet.model}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tireSet.rearSize
              ? `F: ${tireSet.frontSize}  R: ${tireSet.rearSize}`
              : tireSet.frontSize}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={statusVariant(tireSet.status)} className="text-xs">
              {tireSet.status}
            </Badge>
            {tireSet.compound && (
              <Badge variant="outline" className="text-xs">
                {tireSet.compound}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FlameIcon className="size-3" />
              {tireSet.heatCycles} cycles
            </span>
            {latestDepth && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GaugeIcon className="size-3" />
                {latestDepth.depth}/32&quot; tread
              </span>
            )}
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Tire set options"
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTreadSheetOpen(true)}>
              <PlusIcon className="size-4 mr-2" />
              Add Tread Reading
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteTireSetDialog tireSetId={tireSet.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tire Set</DialogTitle>
          </DialogHeader>
          <TireSetForm
            action={updateTireSet}
            carId={carId}
            defaultValues={tireSet}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Tread depth sheet */}
      <Sheet open={treadSheetOpen} onOpenChange={setTreadSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Tread Reading</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TreadDepthForm
              tireSetId={tireSet.id}
              onSuccess={() => setTreadSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TireSetSection({
  label,
  tireSets,
  carId,
}: {
  label: string;
  tireSets: TireSetWithLogs[];
  carId: string;
}) {
  if (tireSets.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{label}</h2>
        <Badge variant="secondary" className="text-xs">
          {tireSets.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {tireSets.map((ts) => (
          <TireSetCard key={ts.id} tireSet={ts} carId={carId} />
        ))}
      </div>
    </div>
  );
}

export function TireSetList({
  active,
  stored,
  retired,
  carId,
}: TireSetListProps) {
  const total = active.length + stored.length + retired.length;

  if (total === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No tire sets logged yet.</p>
        <p className="text-xs mt-1">
          Add your first tire set to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TireSetSection label="Active" tireSets={active} carId={carId} />
      <TireSetSection label="Stored" tireSets={stored} carId={carId} />
      <TireSetSection label="Retired" tireSets={retired} carId={carId} />
    </div>
  );
}
