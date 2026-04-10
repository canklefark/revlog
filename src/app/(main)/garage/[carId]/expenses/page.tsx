import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getExpenseSummary } from "@/lib/queries/expenses";
import { ExpensesPageClient } from "@/components/garage/expenses-page-client";
import { ExportButton } from "@/components/shared/export-button";
import { BackLink } from "@/components/shared/back-link";

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
      <BackLink href={`/garage/${carId}`} label={displayName} />
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
        </div>
        <ExportButton section="expenses" carId={carId} />
      </div>

      <ExpensesPageClient expenses={expenses} summary={summary} carId={carId} />
    </main>
  );
}
