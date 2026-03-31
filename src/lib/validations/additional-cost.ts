import { z } from "zod";

export const createAdditionalCostSchema = z.object({
  eventId: z.string().min(1),
  description: z.string().min(1, "Description is required").max(200),
  amount: z.number().positive("Amount must be positive"),
});

export const deleteAdditionalCostSchema = z.object({
  costId: z.string().min(1),
});

export type CreateAdditionalCostInput = z.infer<
  typeof createAdditionalCostSchema
>;
