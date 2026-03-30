import { cn } from "@/lib/utils";
import type { RegistrationStatus } from "@/lib/constants/event-types";

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  Interested: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  Registered: "bg-green-500/15 text-green-700 dark:text-green-400",
  Waitlisted: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  Completed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Skipped: "bg-red-500/15 text-red-700 dark:text-red-400",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles =
    STATUS_STYLES[status as RegistrationStatus] ??
    "bg-slate-500/15 text-slate-400";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
    >
      {status}
    </span>
  );
}
