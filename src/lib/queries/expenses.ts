import { prisma } from "@/lib/prisma";
import type { Expense } from "@prisma/client";
import { format, subMonths, startOfMonth } from "date-fns";

export type ExpenseSummary = {
  allTime: number;
  currentYear: number;
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; total: number }[];
};

export type ExpensesResult = {
  expenses: Expense[];
  summary: ExpenseSummary;
};

export async function getExpensesForCar(
  carId: string,
  userId: string,
): Promise<Expense[]> {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) return [];

  return prisma.expense.findMany({
    where: { carId, car: { userId } },
    orderBy: { date: "desc" },
  });
}

export async function getExpenseSummary(
  carId: string,
  userId: string,
): Promise<ExpensesResult> {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) {
    return {
      expenses: [],
      summary: {
        allTime: 0,
        currentYear: 0,
        byCategory: [],
        byMonth: [],
      },
    };
  }

  const expenses = await prisma.expense.findMany({
    where: { carId, car: { userId } },
    orderBy: { date: "desc" },
  });

  const currentYear = new Date().getFullYear();

  let allTime = 0;
  let yearTotal = 0;
  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    allTime += expense.amount;
    if (new Date(expense.date).getFullYear() === currentYear) {
      yearTotal += expense.amount;
    }
    const prev = categoryMap.get(expense.category) ?? 0;
    categoryMap.set(expense.category, prev + expense.amount);
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Build the last 12 months bucket labels in order oldest -> newest
  const now = new Date();
  const monthLabels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    monthLabels.push(format(subMonths(now, i), "MMM yyyy"));
  }

  const monthMap = new Map<string, number>(monthLabels.map((m) => [m, 0]));

  for (const expense of expenses) {
    const d = new Date(expense.date);
    // Only include if it falls within the 12-month window
    const cutoff = startOfMonth(subMonths(now, 11));
    if (d >= cutoff) {
      const label = format(d, "MMM yyyy");
      const prev = monthMap.get(label) ?? 0;
      monthMap.set(label, prev + expense.amount);
    }
  }

  const byMonth = monthLabels.map((month) => ({
    month,
    total: monthMap.get(month) ?? 0,
  }));

  return {
    expenses,
    summary: {
      allTime,
      currentYear: yearTotal,
      byCategory,
      byMonth,
    },
  };
}
