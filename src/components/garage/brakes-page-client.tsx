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
import { BrakeSetForm } from "@/components/garage/brake-set-form";
import { BrakeSetList } from "@/components/garage/brake-set-list";
import { createBrakeSet } from "@/lib/actions/brake-set";
import type { GroupedBrakeSets } from "@/lib/queries/brake-sets";

interface BrakesPageClientProps extends GroupedBrakeSets {
  carId: string;
}

export function BrakesPageClient({
  active,
  stored,
  retired,
  carId,
}: BrakesPageClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const total = active.length + stored.length + retired.length;

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          {total > 0 && (
            <p className="text-sm text-muted-foreground">
              {total} brake set{total !== 1 ? "s" : ""} &mdash; {active.length}{" "}
              active
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Brake Set
        </Button>
      </div>

      <BrakeSetList grouped={{ active, stored, retired }} carId={carId} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Brake Set</DialogTitle>
          </DialogHeader>
          <BrakeSetForm
            action={createBrakeSet}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
