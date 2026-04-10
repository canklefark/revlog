export const TIRE_STATUSES = ["Active", "Stored", "Retired"] as const;
export type TireStatus = (typeof TIRE_STATUSES)[number];

export const TREAD_POSITIONS = ["FL", "FR", "RL", "RR"] as const;
export type TreadPosition = (typeof TREAD_POSITIONS)[number];
