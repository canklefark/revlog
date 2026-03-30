import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  homeAddress: z.string().optional(),
  timezone: z.string().optional(),
  units: z.enum(["imperial", "metric"]).optional(),
  seasonBudget: z.union([z.number().positive(), z.literal("")]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
