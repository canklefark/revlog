"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";
import { deleteExpense, type ExpenseActionState } from "@/lib/actions/expense";
import type { Expense } from "@prisma/client";

interface ExpenseListProps {
  expenses: Expense[];
  carId: string;
}

const deleteInitialState: ExpenseActionState = {};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DeleteExpenseForm({ expenseId }: { expenseId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteExpense,
    deleteInitialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) toast.success("Expense deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label="Delete expense"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2Icon className="size-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
            <DialogDescription>
              This will permanently delete this expense record. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="expenseId" value={expenseId} />
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

export function ExpenseList({ expenses, carId }: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered =
    categoryFilter === "all"
      ? expenses
      : expenses.filter((e) => e.category === categoryFilter);

  // expenses arrive already sorted date desc from the query
  // keep that order but apply filter
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No expenses found.</p>
          {categoryFilter !== "all" && (
            <p className="text-xs mt-1">Try clearing the category filter.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {expense.category}
                  </Badge>
                </div>
                <p className="text-sm font-medium mt-0.5 truncate">
                  {expense.vendor
                    ? expense.vendor
                    : expense.description
                      ? expense.description
                      : expense.category}
                </p>
                {expense.vendor && expense.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {expense.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label="Edit expense"
                >
                  <Link href={`/garage/${carId}/expenses/${expense.id}/edit`}>
                    <PencilIcon className="size-4" />
                  </Link>
                </Button>
                <DeleteExpenseForm expenseId={expense.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
