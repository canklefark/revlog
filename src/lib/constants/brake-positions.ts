export const BRAKE_POSITIONS = ["Front", "Rear", "All"] as const;
export type BrakePosition = (typeof BRAKE_POSITIONS)[number];
