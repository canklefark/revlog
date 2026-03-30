import { z } from "zod";

const currentYear = new Date().getFullYear();

export const PRIMARY_USE_VALUES = [
  "Daily",
  "Track Only",
  "Dual Purpose",
  "Stored",
] as const;

export const createCarSchema = z.object({
  year: z
    .number({ error: "Year must be a number" })
    .int()
    .min(1885, "Year must be 1885 or later")
    .max(currentYear + 1, `Year must be ${currentYear + 1} or earlier`),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  nickname: z.string().optional(),
  trim: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  purchaseDate: z.date().optional(),
  purchasePrice: z
    .number({ error: "Purchase price must be a number" })
    .nonnegative("Purchase price must be non-negative")
    .optional(),
  currentOdometer: z
    .number({ error: "Odometer must be a number" })
    .int()
    .nonnegative("Odometer must be non-negative")
    .optional(),
  primaryUse: z.enum(PRIMARY_USE_VALUES).optional(),
  notes: z.string().optional(),
});

export const updateCarSchema = createCarSchema.partial();

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;

/**
 * Form-level schema used with react-hook-form + zodResolver.
 * purchaseDate is kept as a string here because HTML date inputs produce strings.
 * The server action re-parses the date independently via FormData.
 */
export const carFormSchema = z.object({
  year: z
    .number({ error: "Year must be a number" })
    .int()
    .min(1885, "Year must be 1885 or later")
    .max(currentYear + 1, `Year must be ${currentYear + 1} or earlier`),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  nickname: z.string().optional(),
  trim: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z
    .number({ error: "Purchase price must be a number" })
    .nonnegative("Purchase price must be non-negative")
    .optional(),
  currentOdometer: z
    .number({ error: "Odometer must be a number" })
    .int()
    .nonnegative("Odometer must be non-negative")
    .optional(),
  primaryUse: z.enum(PRIMARY_USE_VALUES).optional(),
  notes: z.string().optional(),
});

export type CarFormInput = z.infer<typeof carFormSchema>;
