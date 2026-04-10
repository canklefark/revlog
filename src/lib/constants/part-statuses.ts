export const PART_STATUSES = [
  "wishlist",
  "stock",
  "installed",
  "archived",
] as const;

export type PartStatus = (typeof PART_STATUSES)[number];

export const PART_STATUS_LABELS: Record<PartStatus, string> = {
  wishlist: "Wish List",
  stock: "Stock",
  installed: "Installed",
  archived: "Archived",
};
