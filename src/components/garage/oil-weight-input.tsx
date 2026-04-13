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

// Valid cold-viscosity grades: 0W, 5W (1 digit) and 10W, 15W, 20W, 25W (2 digits).
// Digits starting with 1 or 2 need a second digit before W- is inserted.
//
// Examples:
//   "0"  → "0W-"      "5"  → "5W-"
//   "1"  → "1"        "10" → "10W-"   "15" → "15W-"
//   "2"  → "2"        "20" → "20W-"   "25" → "25W-"
//   "530"→ "5W-30"    "1040"→ "10W-40"
function applyMask(digits: string): string {
  if (digits.length === 0) return "";
  const d = digits.slice(0, 4); // max 4 digits: "1040" → "10W-40"
  const firstDigit = Number(d[0]);
  // Grades starting with 1 or 2 are two-digit cold grades (10, 15, 20, 25)
  const coldLen = firstDigit === 1 || firstDigit === 2 ? 2 : 1;
  const cold = d.slice(0, coldLen);
  if (d.length < coldLen) return cold; // still typing the cold grade — no W- yet
  const hot = d.slice(coldLen, coldLen + 2);
  return hot.length === 0 ? `${cold}W-` : `${cold}W-${hot}`;
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
    // When cursor is at end right after "W-", backspace removes just the "W-"
    // so the user stays in the cold-grade portion: "5W-" → "5", "10W-" → "10"
    if (atEnd && value.endsWith("W-")) {
      e.preventDefault();
      setValue(value.slice(0, -2)); // strip "W-"
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
      maxLength={6}
      aria-invalid={ariaInvalid}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
    />
  );
}
