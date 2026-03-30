export const MOD_CATEGORIES = [
  "Engine",
  "Exhaust",
  "Forced Induction",
  "Intake",
  "Suspension",
  "Brakes",
  "Wheels & Tires",
  "Drivetrain",
  "Exterior",
  "Interior",
  "Electronics",
  "Safety",
  "Other",
] as const;

export type ModCategory = (typeof MOD_CATEGORIES)[number];

export const INSTALLED_BY_OPTIONS = ["Self", "Shop"] as const;
export type InstalledBy = (typeof INSTALLED_BY_OPTIONS)[number];
