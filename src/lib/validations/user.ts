import { z } from "zod";
import { EVENT_TYPES } from "@/lib/constants/event-types";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  homeAddress: z.string().optional(),
  timezone: z.string().optional(),
  units: z.enum(["imperial", "metric"]).optional(),
  seasonBudget: z.union([z.number().positive(), z.literal("")]).optional(),
  defaultEventType: z.enum(EVENT_TYPES).optional().or(z.literal("")).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
