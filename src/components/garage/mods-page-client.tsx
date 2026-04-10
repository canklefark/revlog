"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModForm } from "@/components/garage/mod-form";
import { ModList } from "@/components/garage/mod-list";
import { createMod } from "@/lib/actions/mod";
import type { Mod } from "@prisma/client";

interface ModsPageClientProps {
  grouped: Record<string, Mod[]>;
  totalCost: number;
  carId: string;
}

export function ModsPageClient({
  grouped,
  totalCost,
  carId,
}: ModsPageClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const totalMods = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Mod
        </Button>
      </div>

      {totalMods > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {totalMods} modification{totalMods !== 1 ? "s" : ""}
              </span>
              {totalCost > 0 && (
                <span className="font-semibold">
                  $
                  {totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  total
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ModList grouped={grouped} carId={carId} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Modification</DialogTitle>
          </DialogHeader>
          <ModForm
            action={createMod}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
