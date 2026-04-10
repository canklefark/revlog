import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/garage/expense-form";
import { updateExpense } from "@/lib/actions/expense";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ carId: string; expenseId: string }>;
}) {
  const { carId, expenseId } = await params;
  const userId = await requireAuth();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, car: { userId } },
    include: {
      car: {
        select: {
          userId: true,
          nickname: true,
          year: true,
          make: true,
          model: true,
        },
      },
    },
  });

  if (!expense) notFound();

  const displayName =
    expense.car.nickname ??
    `${expense.car.year} ${expense.car.make} ${expense.car.model}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/garage/${carId}/expenses`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {displayName} / Expenses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Expense</h1>
      </div>

      <ExpenseForm
        action={updateExpense}
        carId={carId}
        defaultValues={expense}
      />
    </div>
  );
}
