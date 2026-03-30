export const WISHLIST_PRIORITIES = ["Low", "Medium", "High"] as const;
export type WishlistPriority = (typeof WISHLIST_PRIORITIES)[number];
