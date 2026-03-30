export const RUN_CONDITIONS = [
  "Dry",
  "Wet",
  "Damp",
  "Cold",
  "Hot",
  "Windy",
] as const;
export type RunCondition = (typeof RUN_CONDITIONS)[number];
