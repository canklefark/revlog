import { z } from "zod";
import {
  SERVICE_TYPES,
  PERFORMED_BY_OPTIONS,
} from "@/lib/constants/maintenance-types";

export const createMaintenanceSchema = z
  .object({
    carId: z.string().min(1, "Car ID is required"),
    serviceType: z.enum(SERVICE_TYPES, { error: "Invalid service type" }),
    customServiceName: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    odometer: z
      .number({ error: "Odometer must be a number" })
      .int()
      .nonnegative("Odometer must be non-negative")
      .optional(),
    performedBy: z.enum(PERFORMED_BY_OPTIONS).optional(),
    shopName: z.string().optional(),
    productBrand: z.string().optional(),
    productSpec: z.string().optional(),
    cost: z
      .number({ error: "Cost must be a number" })
      .nonnegative("Cost must be non-negative")
      .optional(),
    notes: z.string().optional(),
    nextDueDate: z.string().optional(),
    nextDueMileage: z
      .number({ error: "Next due mileage must be a number" })
      .int()
      .nonnegative("Next due mileage must be non-negative")
      .optional(),
    receiptUrl: z.string().url("Receipt URL must be a valid URL").optional(),
  })
  .refine(
    (data) =>
      data.serviceType !== "Custom" ||
      (data.customServiceName && data.customServiceName.length > 0),
    {
      message: "Custom service name is required when service type is Custom",
      path: ["customServiceName"],
    },
  )
  .refine(
    (data) =>
      data.performedBy !== "Shop" ||
      (data.shopName && data.shopName.length > 0),
    {
      message: "Shop name is required when performed by a shop",
      path: ["shopName"],
    },
  );

export const updateMaintenanceSchema = z
  .object({
    entryId: z.string().min(1, "Entry ID is required"),
    serviceType: z.enum(SERVICE_TYPES).optional(),
    customServiceName: z.string().optional(),
    date: z.string().optional(),
    odometer: z
      .number({ error: "Odometer must be a number" })
      .int()
      .nonnegative("Odometer must be non-negative")
      .optional(),
    performedBy: z.enum(PERFORMED_BY_OPTIONS).optional(),
    shopName: z.string().optional(),
    productBrand: z.string().optional(),
    productSpec: z.string().optional(),
    cost: z
      .number({ error: "Cost must be a number" })
      .nonnegative("Cost must be non-negative")
      .optional(),
    notes: z.string().optional(),
    nextDueDate: z.string().optional(),
    nextDueMileage: z
      .number({ error: "Next due mileage must be a number" })
      .int()
      .nonnegative("Next due mileage must be non-negative")
      .optional(),
    receiptUrl: z.string().url("Receipt URL must be a valid URL").optional(),
  })
  .refine(
    (data) =>
      data.serviceType !== "Custom" ||
      !data.serviceType ||
      (data.customServiceName && data.customServiceName.length > 0),
    {
      message: "Custom service name is required when service type is Custom",
      path: ["customServiceName"],
    },
  );

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
