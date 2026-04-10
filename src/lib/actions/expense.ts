"use server";

import { revalidatePath } from "next/cache";
import type { Expense } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/lib/validations/expense";

export type ExpenseActionState = {
  data?: Expense | true;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

function parseRequiredNumber(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

export async function createExpense(
  _prevState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const userId = await requireAuth();

  const raw = {
    carId: formData.get("carId") as string,
    category: formData.get("category") as string,
    date: formData.get("date") as string,
    amount: parseRequiredNumber(formData.get("amount")),
    vendor: parseOptionalString(formData.get("vendor")),
    description: parseOptionalString(formData.get("description")),
    receiptUrl: parseOptionalString(formData.get("receiptUrl")) ?? "",
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const car = await prisma.car.findUnique({
    where: { id: parsed.data.carId },
  });

  if (!car || car.userId !== userId) {
    return { error: "Not found" };
  }

  const expense = await prisma.expense.create({
    data: {
      carId: parsed.data.carId,
      category: parsed.data.category,
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      vendor: parsed.data.vendor,
      description: parsed.data.description,
      receiptUrl: parsed.data.receiptUrl,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/garage/${parsed.data.carId}/expenses`);
  return { data: expense };
}

export async function updateExpense(
  _prevState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const userId = await requireAuth();

  const raw = {
    expenseId: formData.get("expenseId") as string,
    category: parseOptionalString(formData.get("category")),
    date: parseOptionalString(formData.get("date")),
    amount: parseRequiredNumber(formData.get("amount")),
    vendor: parseOptionalString(formData.get("vendor")),
    description: parseOptionalString(formData.get("description")),
    receiptUrl: parseOptionalString(formData.get("receiptUrl")) ?? "",
    notes: parseOptionalString(formData.get("notes")),
  };

  const parsed = updateExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const existing = await prisma.expense.findFirst({
    where: { id: parsed.data.expenseId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  const expense = await prisma.expense.update({
    where: { id: parsed.data.expenseId },
    data: {
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
      ...(parsed.data.date !== undefined && {
        date: new Date(parsed.data.date),
      }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.vendor !== undefined && { vendor: parsed.data.vendor }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.receiptUrl !== undefined && {
        receiptUrl: parsed.data.receiptUrl,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  revalidatePath(`/garage/${existing.car.id}/expenses`);
  return { data: expense };
}

export async function deleteExpense(
  _prevState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const userId = await requireAuth();

  const expenseId = formData.get("expenseId");
  if (!expenseId || typeof expenseId !== "string") {
    return { error: "Expense ID is required" };
  }

  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, car: { userId } },
    include: { car: { select: { id: true } } },
  });

  if (!existing) {
    return { error: "Not found" };
  }

  await prisma.expense.delete({
    where: { id: expenseId },
  });

  revalidatePath(`/garage/${existing.car.id}/expenses`);
  return { data: true };
}
