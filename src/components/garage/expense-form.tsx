"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/lib/constants/expense-categories";
import type { ExpenseActionState } from "@/lib/actions/expense";
import type { Expense } from "@prisma/client";

interface ExpenseFormProps {
  action: (
    prevState: ExpenseActionState,
    formData: FormData,
  ) => Promise<ExpenseActionState>;
  carId: string;
  defaultValues?: Partial<Expense>;
}

const initialState: ExpenseActionState = {};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

export function ExpenseForm({
  action,
  carId,
  defaultValues,
}: ExpenseFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [category, setCategory] = useState<ExpenseCategory | "">(
    (defaultValues?.category as ExpenseCategory) ?? "",
  );

  useEffect(() => {
    if (state.data) {
      toast.success(defaultValues?.id ? "Expense updated" : "Expense added");
      router.push(`/garage/${carId}/expenses`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="expenseId" value={defaultValues.id} />
      )}
      <input type="hidden" name="category" value={category} />

      <div className="space-y-1.5">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ExpenseCategory)}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("category") && (
          <p className="text-xs text-destructive">{fieldError("category")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={formatDateForInput(defaultValues?.date)}
            aria-invalid={!!fieldError("date")}
          />
          {fieldError("date") && (
            <p className="text-xs text-destructive">{fieldError("date")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            defaultValue={defaultValues?.amount ?? ""}
            aria-invalid={!!fieldError("amount")}
          />
          {fieldError("amount") && (
            <p className="text-xs text-destructive">{fieldError("amount")}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vendor">Vendor</Label>
        <Input
          id="vendor"
          name="vendor"
          type="text"
          placeholder="e.g. Costco, Allstate, Summit Racing"
          defaultValue={defaultValues?.vendor ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Brief description of the expense"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receiptUrl">Receipt URL (optional)</Label>
        <Input
          id="receiptUrl"
          name="receiptUrl"
          type="text"
          placeholder="https://..."
          defaultValue={defaultValues?.receiptUrl ?? ""}
          aria-invalid={!!fieldError("receiptUrl")}
        />
        {fieldError("receiptUrl") && (
          <p className="text-xs text-destructive">{fieldError("receiptUrl")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any additional notes..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
      </Button>
    </form>
  );
}
