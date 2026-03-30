export const EVENT_TYPES = [
  "Autocross",
  "RallyCross",
  "HPDE",
  "Track Day",
  "Time Attack",
  "Drag",
  "Test & Tune",
  "Practice Session",
  "Hill Climb",
  "Endurance",
  "Drift",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const REGISTRATION_STATUSES = [
  "Interested",
  "Registered",
  "Waitlisted",
  "Completed",
  "Skipped",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
