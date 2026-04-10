export const BUG_REPORT_CATEGORIES = ["bug", "feature", "other"] as const;
export type BugReportCategory = (typeof BUG_REPORT_CATEGORIES)[number];

export const BUG_REPORT_STATUSES = [
  "open",
  "acknowledged",
  "resolved",
  "closed",
] as const;
export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];

export const BUG_REPORT_CATEGORY_LABELS: Record<BugReportCategory, string> = {
  bug: "Bug",
  feature: "Feature Request",
  other: "Other",
};

export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  closed: "Closed",
};

export const BUG_REPORT_STATUS_VARIANTS: Record<
  BugReportStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "destructive",
  acknowledged: "default",
  resolved: "secondary",
  closed: "outline",
};
