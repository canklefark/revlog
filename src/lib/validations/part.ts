import { z } from "zod";
import { MOD_CATEGORIES } from "@/lib/constants/mod-categories";
import { PART_STATUSES } from "@/lib/constants/part-statuses";

export const createPartSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  category: z
    .enum(MOD_CATEGORIES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
  productLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: z.enum(PART_STATUSES).default("stock"),
  carId: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  price: z
    .number({ error: "Price must be a number" })
    .nonnegative("Price must be non-negative")
    .optional(),
  purchaseDate: z.string().optional(),
  vendor: z.string().optional(),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .int()
    .min(1, "Quantity must be at least 1")
    .default(1),
  notes: z.string().optional(),
});

export const updatePartSchema = z.object({
  partId: z.string().min(1, "Part ID is required"),
  name: z.string().min(1, "Part name is required").optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  category: z
    .enum(MOD_CATEGORIES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
  productLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: z.enum(PART_STATUSES).optional(),
  carId: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  price: z
    .number({ error: "Price must be a number" })
    .nonnegative("Price must be non-negative")
    .optional(),
  purchaseDate: z.string().optional(),
  vendor: z.string().optional(),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .int()
    .min(1)
    .optional(),
  notes: z.string().optional(),
  installedAt: z.string().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
