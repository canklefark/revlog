import { z } from "zod";

export const penaltyItemSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().nonnegative(),
  secondsEach: z.number().nonnegative(),
});

export type PenaltyItem = z.infer<typeof penaltyItemSchema>;

export const createRunSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  carId: z.string().min(1, "Car ID is required"),
  runNumber: z.number().int().positive("Run number must be positive"),
  rawTime: z.number().positive("Raw time must be positive"),
  penalties: z.array(penaltyItemSchema).default([]),
  conditions: z.array(z.string()).default([]),
  tireSetup: z.string().optional(),
  tireSetId: z.string().optional(),
  brakeSetId: z.string().optional(),
  setupId: z.string().optional(),
  sessionLabel: z.string().optional(),
  notes: z.string().optional(),
  isDnf: z.boolean().default(false),
});

export const updateRunSchema = z.object({
  runId: z.string().min(1, "Run ID is required"),
  runNumber: z
    .number()
    .int()
    .positive("Run number must be positive")
    .optional(),
  rawTime: z.number().positive("Raw time must be positive").optional(),
  penalties: z.array(penaltyItemSchema).optional(),
  conditions: z.array(z.string()).optional(),
  tireSetup: z.string().optional(),
  tireSetId: z.string().optional(),
  brakeSetId: z.string().optional(),
  setupId: z.string().optional(),
  sessionLabel: z.string().optional(),
  notes: z.string().optional(),
  isDnf: z.boolean().optional(),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type UpdateRunInput = z.infer<typeof updateRunSchema>;
