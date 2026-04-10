import { z } from "zod";

const optionalFloat = z
  .number({ error: "Must be a number" })
  .finite("Must be a finite number")
  .optional();

const optionalPositiveFloat = z
  .number({ error: "Must be a number" })
  .positive("Must be positive")
  .finite("Must be a finite number")
  .optional();

const optionalInt = z
  .number({ error: "Must be a number" })
  .int("Must be a whole number")
  .nonnegative("Must be 0 or greater")
  .optional();

const optionalString = z.string().optional();

export const createSetupSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  name: z.string().min(1, "Setup name is required"),
  isActive: z.boolean().default(false),
  // Alignment
  camberFL: optionalFloat,
  camberFR: optionalFloat,
  camberRL: optionalFloat,
  camberRR: optionalFloat,
  toeFL: optionalFloat,
  toeFR: optionalFloat,
  toeRL: optionalFloat,
  toeRR: optionalFloat,
  casterFL: optionalFloat,
  casterFR: optionalFloat,
  // Suspension
  springRateFront: optionalPositiveFloat,
  springRateRear: optionalPositiveFloat,
  rideHeightFront: optionalPositiveFloat,
  rideHeightRear: optionalPositiveFloat,
  damperClicksFrontComp: optionalInt,
  damperClicksFrontReb: optionalInt,
  damperClicksRearComp: optionalInt,
  damperClicksRearReb: optionalInt,
  swayBarFront: optionalString,
  swayBarRear: optionalString,
  // Tire pressures
  tirePressureFL: optionalPositiveFloat,
  tirePressureFR: optionalPositiveFloat,
  tirePressureRL: optionalPositiveFloat,
  tirePressureRR: optionalPositiveFloat,
  notes: optionalString,
});

export const updateSetupSchema = z.object({
  setupId: z.string().min(1, "Setup ID is required"),
  name: z.string().min(1, "Setup name is required").optional(),
  isActive: z.boolean().optional(),
  // Alignment
  camberFL: optionalFloat,
  camberFR: optionalFloat,
  camberRL: optionalFloat,
  camberRR: optionalFloat,
  toeFL: optionalFloat,
  toeFR: optionalFloat,
  toeRL: optionalFloat,
  toeRR: optionalFloat,
  casterFL: optionalFloat,
  casterFR: optionalFloat,
  // Suspension
  springRateFront: optionalPositiveFloat,
  springRateRear: optionalPositiveFloat,
  rideHeightFront: optionalPositiveFloat,
  rideHeightRear: optionalPositiveFloat,
  damperClicksFrontComp: optionalInt,
  damperClicksFrontReb: optionalInt,
  damperClicksRearComp: optionalInt,
  damperClicksRearReb: optionalInt,
  swayBarFront: optionalString,
  swayBarRear: optionalString,
  // Tire pressures
  tirePressureFL: optionalPositiveFloat,
  tirePressureFR: optionalPositiveFloat,
  tirePressureRL: optionalPositiveFloat,
  tirePressureRR: optionalPositiveFloat,
  notes: optionalString,
});

export type CreateSetupInput = z.infer<typeof createSetupSchema>;
export type UpdateSetupInput = z.infer<typeof updateSetupSchema>;
