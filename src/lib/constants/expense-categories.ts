export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Insurance",
  "Registration & Fees",
  "Parts",
  "Labor",
  "Storage",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
