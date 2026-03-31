import { z } from "zod";

export const snoozeMaintenanceSchema = z
  .object({
    entryId: z.string().min(1),
    duration: z.enum(["1week", "2weeks", "1month", "custom"]),
    customDate: z.string().optional(),
  })
  .refine(
    (data) => data.duration !== "custom" || Boolean(data.customDate?.trim()),
    { message: "Date is required for custom snooze", path: ["customDate"] },
  );

export const unsnoozeMaintenanceSchema = z.object({
  entryId: z.string().min(1),
});
