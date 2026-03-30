export const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Tire Change",
  "Brake Fluid Flush",
  "Coolant Flush",
  "Valve Adjustment",
  "Alignment",
  "Brake Pads",
  "Brake Rotors",
  "Spark Plugs",
  "Air Filter",
  "Transmission Fluid",
  "Differential Fluid",
  "Belt/Chain Service",
  "Wheel Bearing",
  "Clutch",
  "Power Steering Fluid",
  "Wiper Blades",
  "Battery",
  "Inspection",
  "Custom",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PERFORMED_BY_OPTIONS = ["Self", "Shop"] as const;
export type PerformedBy = (typeof PERFORMED_BY_OPTIONS)[number];
