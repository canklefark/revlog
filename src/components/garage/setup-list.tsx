"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteSetup,
  setActiveSetup,
  type SetupActionState,
} from "@/lib/actions/suspension-setup";
import type { SetupWithRunCount } from "@/lib/queries/suspension-setups";

interface SetupListProps {
  setups: SetupWithRunCount[];
  carId: string;
}

const initialState: SetupActionState = {};

function DeleteSetupForm({ setupId }: { setupId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteSetup,
    initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) toast.success("Setup deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label="Delete setup"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2Icon className="size-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete setup?</DialogTitle>
            <DialogDescription>
              This will permanently delete this suspension setup. Runs that
              referenced it will lose the link. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="setupId" value={setupId} />
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

function SetActiveForm({
  setupId,
  isActive,
}: {
  setupId: string;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    setActiveSetup,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Active setup updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  if (isActive) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="setupId" value={setupId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="h-8 text-xs"
      >
        <CheckCircleIcon className="size-3 mr-1" />
        {isPending ? "Activating..." : "Set Active"}
      </Button>
    </form>
  );
}

function formatValue(value: number | null | undefined, unit: string): string {
  if (value == null) return "—";
  return `${value}${unit}`;
}

export function SetupList({ setups, carId }: SetupListProps) {
  if (setups.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No setups documented yet.</p>
        <p className="text-xs mt-1">
          Create your first setup to start tracking configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {setups.map((setup) => (
        <div
          key={setup.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/garage/${carId}/setups/${setup.id}`}
                  className="font-medium text-sm hover:underline underline-offset-2 truncate"
                >
                  {setup.name}
                </Link>
                {setup.isActive && (
                  <Badge className="text-xs shrink-0 bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/15">
                    Active
                  </Badge>
                )}
              </div>

              {/* Key stats */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {setup.camberFL != null && (
                  <span className="text-xs text-muted-foreground">
                    Camber F: {setup.camberFL}&deg;
                  </span>
                )}
                {setup.toeFL != null && (
                  <span className="text-xs text-muted-foreground">
                    Toe F: {setup.toeFL}&deg;
                  </span>
                )}
                {setup.tirePressureFL != null && (
                  <span className="text-xs text-muted-foreground">
                    Press. FL: {setup.tirePressureFL} PSI
                  </span>
                )}
                {setup._count.runs > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {setup._count.runs} run{setup._count.runs !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <SetActiveForm setupId={setup.id} isActive={setup.isActive} />
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label="Edit setup"
              >
                <Link href={`/garage/${carId}/setups/${setup.id}/edit`}>
                  <PencilIcon className="size-4" />
                </Link>
              </Button>
              <DeleteSetupForm setupId={setup.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
