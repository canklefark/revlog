"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface OilWeightInputProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  "aria-invalid"?: boolean;
  className?: string;
}

// Eagerly inserts W- after the first digit group
// "5"    → "5W-"
// "5W-3" → "5W-30"
// "10"   → "10W-"
// "10W-4"→ "10W-40"
function applyMask(digits: string): string {
  // Viscosity grades: 0, 5, 10, 15, 20 (first group, 1-2 digits)
  // then W- then 2-digit number
  const d = digits.slice(0, 4); // max "1040" → "10W-40"
  if (d.length === 0) return "";
  // First group: up to 2 digits before the W
  // Common cold grades: 0, 5, 10, 15, 20 — all 1–2 digits
  const firstGroupLen =
    d.length >= 2 &&
    Number(d.slice(0, 2)) % 5 === 0 &&
    Number(d.slice(0, 2)) <= 25
      ? 2
      : 1;
  const cold = d.slice(0, firstGroupLen);
  if (d.length <= firstGroupLen)
    return cold.length === firstGroupLen ? `${cold}W-` : cold;
  const hot = d.slice(firstGroupLen, firstGroupLen + 2);
  return `${cold}W-${hot}`;
}

export function OilWeightInput({
  id,
  name = "productSpec",
  defaultValue = "",
  "aria-invalid": ariaInvalid,
  className,
}: OilWeightInputProps) {
  const [value, setValue] = useState(() =>
    applyMask(defaultValue.replace(/\D/g, "")),
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    const atEnd = e.currentTarget.selectionStart === value.length;
    if (atEnd && value.endsWith("W-")) {
      e.preventDefault();
      const digits = value.replace(/\D/g, "");
      setValue(applyMask(digits.slice(0, -1)));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setValue(applyMask(digits));
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="5W-30"
      maxLength={7}
      aria-invalid={ariaInvalid}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
    />
  );
}
