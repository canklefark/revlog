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
import { TireSetForm } from "@/components/garage/tire-set-form";
import { TireSetList } from "@/components/garage/tire-set-list";
import { createTireSet } from "@/lib/actions/tire-set";
import type { GroupedTireSets } from "@/lib/queries/tire-sets";

interface TiresPageClientProps extends GroupedTireSets {
  carId: string;
}

export function TiresPageClient({
  active,
  stored,
  retired,
  carId,
}: TiresPageClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const total = active.length + stored.length + retired.length;

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tires</h1>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} tire set{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Tire Set
        </Button>
      </div>

      <TireSetList
        active={active}
        stored={stored}
        retired={retired}
        carId={carId}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Tire Set</DialogTitle>
          </DialogHeader>
          <TireSetForm
            action={createTireSet}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
