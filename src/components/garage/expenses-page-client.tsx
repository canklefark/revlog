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
import { ExpenseForm } from "@/components/garage/expense-form";
import { ExpenseList } from "@/components/garage/expense-list";
import { ExpenseSummaryView } from "@/components/garage/expense-summary";
import { createExpense } from "@/lib/actions/expense";
import type { Expense } from "@prisma/client";
import type { ExpenseSummary } from "@/lib/queries/expenses";

interface ExpensesPageClientProps {
  expenses: Expense[];
  summary: ExpenseSummary;
  carId: string;
}

export function ExpensesPageClient({
  expenses,
  summary,
  carId,
}: ExpensesPageClientProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Expense
        </Button>
      </div>

      <div className="mb-6">
        <ExpenseSummaryView summary={summary} />
      </div>

      <ExpenseList expenses={expenses} carId={carId} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            action={createExpense}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
