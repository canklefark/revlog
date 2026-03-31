"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { TrashIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createAdditionalCost,
  deleteAdditionalCost,
  type AdditionalCostActionState,
} from "@/lib/actions/additional-cost";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface AdditionalCostsSectionProps {
  eventId: string;
  costs: Array<{ id: string; description: string; amount: number }>;
}

const initialState: AdditionalCostActionState = {};

function DeleteCostForm({ costId }: { costId: string }) {
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteAdditionalCost,
    initialState,
  );

  useEffect(() => {
    if (deleteState.data === true) {
      toast.success("Cost removed");
    }
  }, [deleteState.data]);

  useEffect(() => {
    if (deleteState.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState.error]);

  return (
    <form action={deleteAction}>
      <input type="hidden" name="costId" value={costId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-destructive shrink-0"
        disabled={isDeletePending}
        aria-label="Remove cost"
      >
        <TrashIcon className="size-3.5" />
      </Button>
    </form>
  );
}

export function AdditionalCostsSection({
  eventId,
  costs,
}: AdditionalCostsSectionProps) {
  const [createState, createAction, isCreatePending] = useActionState(
    createAdditionalCost,
    initialState,
  );

  useEffect(() => {
    if (createState.data && createState.data !== true) {
      toast.success("Cost added");
    }
  }, [createState.data]);

  useEffect(() => {
    if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState.error]);

  const total = costs.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Additional Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {costs.length > 0 && (
          <>
            <ul className="space-y-2">
              {costs.map((cost) => (
                <li
                  key={cost.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-foreground/90">
                    {cost.description}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-medium tabular-nums">
                      {usd.format(cost.amount)}
                    </span>
                    <DeleteCostForm costId={cost.id} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span className="tabular-nums">{usd.format(total)}</span>
            </div>
          </>
        )}

        <form action={createAction} className="flex items-center gap-2 pt-1">
          <input type="hidden" name="eventId" value={eventId} />
          <Input
            name="description"
            placeholder="Description"
            className="h-8 text-sm flex-1 min-w-0"
            maxLength={200}
            required
          />
          <Input
            name="amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="h-8 text-sm w-24 shrink-0"
            required
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 shrink-0"
            disabled={isCreatePending}
          >
            <PlusIcon className="size-3.5 mr-1" />
            Add
          </Button>
        </form>
        {createState.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {createState.fieldErrors.description[0]}
          </p>
        )}
        {createState.fieldErrors?.amount && (
          <p className="text-xs text-destructive">
            {createState.fieldErrors.amount[0]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
