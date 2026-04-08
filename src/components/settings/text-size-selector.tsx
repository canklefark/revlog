"use client";

import {
  useTextSize,
  type TextSize,
} from "@/components/layout/text-size-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: TextSize; label: string; description: string }[] = [
  {
    value: "compact",
    label: "Compact",
    description: "Smaller text, more content visible",
  },
  { value: "normal", label: "Normal", description: "Default size" },
  { value: "large", label: "Large", description: "Easier to read" },
];

export function TextSizeSelector() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {OPTIONS.map(({ value, label, description }) => (
        <button
          key={value}
          onClick={() => setTextSize(value)}
          className={cn(
            "flex flex-1 flex-col items-start gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
            textSize === value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground",
          )}
        >
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs">{description}</span>
        </button>
      ))}
    </div>
  );
}
