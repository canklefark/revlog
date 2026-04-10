import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getExpenseSummary } from "@/lib/queries/expenses";
import { ExpenseSummaryView } from "@/components/garage/expense-summary";
import { ExpenseList } from "@/components/garage/expense-list";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/export-button";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const { expenses, summary } = await getExpenseSummary(carId, userId);
  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <Link
            href={`/garage/${carId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {displayName}
          </Link>
          <h1 className="text-2xl font-semibold">Expenses</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton section="expenses" carId={carId} />
          <Button asChild size="sm">
            <Link href={`/garage/${carId}/expenses/new`}>
              <PlusIcon />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <ExpenseSummaryView summary={summary} />
      </div>

      <ExpenseList expenses={expenses} carId={carId} />
    </main>
  );
}
