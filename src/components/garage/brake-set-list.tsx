"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PencilIcon,
  Trash2Icon,
  FlameIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteBrakeSet,
  incrementBrakeHeatCycles,
  type BrakeSetActionState,
} from "@/lib/actions/brake-set";
import type { BrakeSet } from "@prisma/client";
import type { GroupedBrakeSets } from "@/lib/queries/brake-sets";

interface BrakeSetListProps {
  grouped: GroupedBrakeSets;
  carId: string;
}

const deleteInitialState: BrakeSetActionState = {};
const heatInitialState: BrakeSetActionState = {};

function getWearColor(wear: number): string {
  if (wear < 20) return "hsl(var(--destructive))";
  if (wear <= 50) return "#eab308";
  return "#22c55e";
}

function WearBar({ wear }: { wear: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Wear Remaining</span>
        <span className="font-medium">{wear}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full transition-all"
          style={{
            width: `${wear}%`,
            backgroundColor: getWearColor(wear),
          }}
        />
      </div>
    </div>
  );
}

function positionVariant(
  position: string,
): "default" | "secondary" | "outline" {
  if (position === "Front") return "default";
  if (position === "Rear") return "secondary";
  return "outline";
}

function HeatCycleForm({ brakeSetId }: { brakeSetId: string }) {
  const [state, formAction, isPending] = useActionState(
    incrementBrakeHeatCycles,
    heatInitialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Heat cycle recorded");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="brakeSetId" value={brakeSetId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <FlameIcon className="size-4 mr-2" />
          {isPending ? "Recording..." : "+1 Heat Cycle"}
        </button>
      </DropdownMenuItem>
    </form>
  );
}

function DeleteBrakeSetForm({ brakeSetId }: { brakeSetId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteBrakeSet,
    deleteInitialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) toast.success("Brake set deleted");
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
            <DialogTitle>Delete brake set?</DialogTitle>
            <DialogDescription>
              This will permanently delete this brake set. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="brakeSetId" value={brakeSetId} />
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

function BrakeSetCard({
  brakeSet,
  carId,
}: {
  brakeSet: BrakeSet;
  carId: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={positionVariant(brakeSet.position)}>
            {brakeSet.position}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {brakeSet.status}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Brake set actions"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/garage/${carId}/brakes/${brakeSet.id}/edit`}>
                <PencilIcon className="size-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <HeatCycleForm brakeSetId={brakeSet.id} />
            <DropdownMenuSeparator />
            <DeleteBrakeSetForm brakeSetId={brakeSet.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        href={`/garage/${carId}/brakes/${brakeSet.id}`}
        className="block group"
      >
        <div className="space-y-1">
          {brakeSet.padBrand || brakeSet.padCompound ? (
            <p className="text-sm font-medium group-hover:underline">
              {[brakeSet.padBrand, brakeSet.padCompound]
                .filter(Boolean)
                .join(" ")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic group-hover:underline">
              No pad info
            </p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FlameIcon className="size-3" />
          {brakeSet.heatCycles} cycle{brakeSet.heatCycles !== 1 ? "s" : ""}
        </span>
      </div>

      {brakeSet.wearRemaining !== null &&
        brakeSet.wearRemaining !== undefined && (
          <WearBar wear={brakeSet.wearRemaining} />
        )}
    </div>
  );
}

function StatusGroup({
  label,
  brakeSets,
  carId,
}: {
  label: string;
  brakeSets: BrakeSet[];
  carId: string;
}) {
  if (brakeSets.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold">{label}</h2>
        <Badge variant="secondary" className="text-xs">
          {brakeSets.length}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {brakeSets.map((b) => (
          <BrakeSetCard key={b.id} brakeSet={b} carId={carId} />
        ))}
      </div>
    </div>
  );
}

export function BrakeSetList({ grouped, carId }: BrakeSetListProps) {
  const total =
    grouped.active.length + grouped.stored.length + grouped.retired.length;

  if (total === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No brake sets logged yet.</p>
        <p className="text-xs mt-1">
          Add your first brake set to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StatusGroup label="Active" brakeSets={grouped.active} carId={carId} />
      {grouped.active.length > 0 &&
        (grouped.stored.length > 0 || grouped.retired.length > 0) && (
          <Separator />
        )}
      <StatusGroup label="Stored" brakeSets={grouped.stored} carId={carId} />
      {grouped.stored.length > 0 && grouped.retired.length > 0 && <Separator />}
      <StatusGroup label="Retired" brakeSets={grouped.retired} carId={carId} />
    </div>
  );
}
