"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TREAD_POSITIONS } from "@/lib/constants/tire-statuses";
import {
  addTreadDepthLog,
  type TireSetActionState,
} from "@/lib/actions/tire-set";

interface TreadDepthFormProps {
  tireSetId: string;
  onSuccess?: () => void;
}

const initialState: TireSetActionState = {};

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function TreadDepthForm({ tireSetId, onSuccess }: TreadDepthFormProps) {
  const [state, formAction, isPending] = useActionState(
    addTreadDepthLog,
    initialState,
  );

  useEffect(() => {
    if (state.data) {
      toast.success("Tread depth reading added");
      onSuccess?.();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tireSetId" value={tireSetId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="depth">Depth (32nds) *</Label>
          <Input
            id="depth"
            name="depth"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            required
            aria-invalid={!!fieldError("depth")}
          />
          {fieldError("depth") && (
            <p className="text-xs text-destructive">{fieldError("depth")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tread-position">Position</Label>
          <Select name="position">
            <SelectTrigger id="tread-position" className="w-full">
              <SelectValue placeholder="All / N/A" />
            </SelectTrigger>
            <SelectContent>
              {TREAD_POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tread-date">Date</Label>
        <Input
          id="tread-date"
          name="date"
          type="date"
          defaultValue={todayDateString()}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tread-notes">Notes</Label>
        <Textarea
          id="tread-notes"
          name="notes"
          placeholder="Optional notes..."
          rows={2}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Add Reading"}
      </Button>
    </form>
  );
}
