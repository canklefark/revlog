import { z } from "zod";
import {
  MOD_CATEGORIES,
  INSTALLED_BY_OPTIONS,
} from "@/lib/constants/mod-categories";

export const createModSchema = z
  .object({
    carId: z.string().min(1, "Car ID is required"),
    name: z.string().min(1, "Name is required"),
    category: z.enum(MOD_CATEGORIES, { error: "Invalid category" }),
    brand: z.string().optional(),
    partNumber: z.string().optional(),
    installDate: z.string().optional(),
    installedBy: z.enum(INSTALLED_BY_OPTIONS).optional(),
    shopName: z.string().optional(),
    cost: z
      .number({ error: "Cost must be a number" })
      .nonnegative("Cost must be non-negative")
      .optional(),
    odometerAtInstall: z
      .number({ error: "Odometer must be a number" })
      .int()
      .nonnegative("Odometer must be non-negative")
      .optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.installedBy !== "Shop" ||
      (data.shopName && data.shopName.length > 0),
    {
      message: "Shop name is required when installed by a shop",
      path: ["shopName"],
    },
  );

export const updateModSchema = z.object({
  modId: z.string().min(1, "Mod ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  category: z.enum(MOD_CATEGORIES).optional(),
  brand: z.string().optional(),
  partNumber: z.string().optional(),
  installDate: z.string().optional(),
  installedBy: z.enum(INSTALLED_BY_OPTIONS).optional(),
  shopName: z.string().optional(),
  cost: z
    .number({ error: "Cost must be a number" })
    .nonnegative("Cost must be non-negative")
    .optional(),
  odometerAtInstall: z
    .number({ error: "Odometer must be a number" })
    .int()
    .nonnegative("Odometer must be non-negative")
    .optional(),
  notes: z.string().optional(),
});

export type CreateModInput = z.infer<typeof createModSchema>;
export type UpdateModInput = z.infer<typeof updateModSchema>;
