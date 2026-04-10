import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";

export const createExpenseSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  category: z.enum(EXPENSE_CATEGORIES, { error: "Invalid category" }),
  date: z.string().min(1, "Date is required"),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  vendor: z.string().optional(),
  description: z.string().optional(),
  receiptUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  notes: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, "Expense ID is required"),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  date: z.string().optional(),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .optional(),
  vendor: z.string().optional(),
  description: z.string().optional(),
  receiptUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
