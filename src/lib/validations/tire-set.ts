import { z } from "zod";
import { TIRE_STATUSES, TREAD_POSITIONS } from "@/lib/constants/tire-statuses";

export const createTireSetSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  size: z.string().min(1, "Size is required"),
  compound: z.string().optional(),
  purchaseDate: z.string().optional(),
  cost: z
    .number({ error: "Cost must be a number" })
    .nonnegative("Cost must be non-negative")
    .optional(),
  status: z.enum(TIRE_STATUSES).default("Active"),
  notes: z.string().optional(),
});

export const updateTireSetSchema = z.object({
  tireSetId: z.string().min(1, "Tire set ID is required"),
  brand: z.string().min(1, "Brand is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  size: z.string().min(1, "Size is required").optional(),
  compound: z.string().optional(),
  purchaseDate: z.string().optional(),
  cost: z
    .number({ error: "Cost must be a number" })
    .nonnegative("Cost must be non-negative")
    .optional(),
  status: z.enum(TIRE_STATUSES).optional(),
  notes: z.string().optional(),
});

export const addTreadDepthSchema = z.object({
  tireSetId: z.string().min(1, "Tire set ID is required"),
  depth: z
    .number({ error: "Depth must be a number" })
    .positive("Depth must be positive"),
  date: z.string().optional(),
  position: z.enum(TREAD_POSITIONS).optional(),
  notes: z.string().optional(),
});

export type CreateTireSetInput = z.infer<typeof createTireSetSchema>;
export type UpdateTireSetInput = z.infer<typeof updateTireSetSchema>;
export type AddTreadDepthInput = z.infer<typeof addTreadDepthSchema>;
