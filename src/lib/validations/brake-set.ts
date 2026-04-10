import { z } from "zod";
import { BRAKE_POSITIONS } from "@/lib/constants/brake-positions";
import { TIRE_STATUSES } from "@/lib/constants/tire-statuses";

export const createBrakeSetSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  position: z.enum(BRAKE_POSITIONS, { error: "Invalid position" }),
  padBrand: z.string().optional(),
  padCompound: z.string().optional(),
  rotorBrand: z.string().optional(),
  rotorNotes: z.string().optional(),
  purchaseDate: z.string().optional(),
  cost: z
    .number({ error: "Cost must be a number" })
    .nonnegative("Cost must be non-negative")
    .optional(),
  wearRemaining: z
    .number({ error: "Wear remaining must be a number" })
    .min(0, "Must be at least 0")
    .max(100, "Must be at most 100")
    .optional(),
  status: z.enum(TIRE_STATUSES).default("Active"),
  notes: z.string().optional(),
});

export const updateBrakeSetSchema = z.object({
  brakeSetId: z.string().min(1, "Brake set ID is required"),
  position: z.enum(BRAKE_POSITIONS).optional(),
  padBrand: z.string().optional(),
  padCompound: z.string().optional(),
  rotorBrand: z.string().optional(),
  rotorNotes: z.string().optional(),
  purchaseDate: z.string().optional(),
  cost: z
    .number({ error: "Cost must be a number" })
    .nonnegative("Cost must be non-negative")
    .optional(),
  wearRemaining: z
    .number({ error: "Wear remaining must be a number" })
    .min(0, "Must be at least 0")
    .max(100, "Must be at most 100")
    .optional(),
  status: z.enum(TIRE_STATUSES).optional(),
  notes: z.string().optional(),
});

export type CreateBrakeSetInput = z.infer<typeof createBrakeSetSchema>;
export type UpdateBrakeSetInput = z.infer<typeof updateBrakeSetSchema>;
