import { cn } from "@/lib/utils";
import type { RegistrationStatus } from "@/lib/constants/event-types";

const STATUS_DOT: Record<RegistrationStatus, string> = {
  Interested: "bg-slate-400",
  Registered: "bg-green-400",
  Waitlisted: "bg-yellow-400",
  Completed: "bg-blue-400",
  Skipped: "bg-red-400",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const dot = STATUS_DOT[status as RegistrationStatus] ?? "bg-slate-400";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
      {status}
    </span>
  );
}
