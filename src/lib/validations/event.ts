import { z } from "zod";
import {
  EVENT_TYPES,
  REGISTRATION_STATUSES,
} from "@/lib/constants/event-types";

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  type: z.enum(EVENT_TYPES, { error: "Invalid event type" }),
  organizingBody: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  registrationStatus: z.enum(REGISTRATION_STATUSES).default("Interested"),
  registrationDeadline: z.string().optional(),
  entryFee: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  registrationUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  runGroup: z.string().optional(),
  notes: z.string().optional(),
  carId: z.string().optional(),
});

export const updateEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z.string().min(1).optional(),
  type: z.enum(EVENT_TYPES).optional(),
  organizingBody: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  registrationStatus: z.enum(REGISTRATION_STATUSES).optional(),
  registrationDeadline: z.string().optional(),
  entryFee: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  registrationUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  runGroup: z.string().optional(),
  notes: z.string().optional(),
  carId: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
