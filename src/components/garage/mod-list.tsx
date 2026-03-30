"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteMod, type ModActionState } from "@/lib/actions/mod";
import type { Mod } from "@prisma/client";

interface ModListProps {
  grouped: Record<string, Mod[]>;
  carId: string;
}

const deleteInitialState: ModActionState = {};

function DeleteModForm({ modId }: { modId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteMod,
    deleteInitialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Modification deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="modId" value={modId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={isPending}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label="Delete modification"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </form>
  );
}

export function ModList({ grouped, carId }: ModListProps) {
  const categories = Object.keys(grouped).sort();

  if (categories.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No modifications logged yet.</p>
        <p className="text-xs mt-1">Add your first mod to start tracking.</p>
      </div>
    );
  }

  return (
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
          <div className="space-y-2">
            {grouped[category].map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{mod.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {mod.brand && (
                      <span className="text-xs text-muted-foreground">
                        {mod.brand}
                      </span>
                    )}
                    {mod.cost != null && (
                      <span className="text-xs text-muted-foreground">
                        $
                        {mod.cost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                    {mod.installDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(mod.installDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Edit modification"
                  >
                    <Link href={`/garage/${carId}/mods/${mod.id}/edit`}>
                      <PencilIcon className="size-4" />
                    </Link>
                  </Button>
                  <DeleteModForm modId={mod.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
