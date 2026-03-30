import { cn } from "@/lib/utils";
import { EVENT_TYPE_COLORS } from "@/lib/constants/event-colors";
import type { EventType } from "@/lib/constants/event-types";

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const colors =
    EVENT_TYPE_COLORS[type as EventType] ?? EVENT_TYPE_COLORS.Other;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors.badge,
        className,
      )}
    >
      {type}
    </span>
  );
}
