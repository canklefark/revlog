export const PENALTY_TYPES = [
  "Cone",
  "Gate",
  "Off-Course",
  "Red Flag",
  "Other",
] as const;
export type PenaltyType = (typeof PENALTY_TYPES)[number];
