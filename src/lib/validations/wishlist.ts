import { z } from "zod";
import { MOD_CATEGORIES } from "@/lib/constants/mod-categories";
import { WISHLIST_PRIORITIES } from "@/lib/constants/wishlist-priorities";

export const createWishlistSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  category: z.enum(MOD_CATEGORIES).optional(),
  estimatedCost: z
    .number({ error: "Estimated cost must be a number" })
    .nonnegative("Estimated cost must be non-negative")
    .optional(),
  priority: z.enum(WISHLIST_PRIORITIES).default("Medium"),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updateWishlistSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  brand: z.string().optional(),
  category: z.enum(MOD_CATEGORIES).optional(),
  estimatedCost: z
    .number({ error: "Estimated cost must be a number" })
    .nonnegative("Estimated cost must be non-negative")
    .optional(),
  priority: z.enum(WISHLIST_PRIORITIES).optional(),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
