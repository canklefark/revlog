"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TireSizeInputProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  "aria-invalid"?: boolean;
  className?: string;
}

// Eagerly inserts / at 3 digits and R at 5 digits
// "225"     → "225/"
// "225/50"  → "225/50R"
// "225/50R" → "225/50R17" etc.
function applyMask(digits: string): string {
  const d = digits.slice(0, 7);
  if (d.length < 3) return d;
  const width = d.slice(0, 3);
  if (d.length === 3) return `${width}/`;
  const aspect = d.slice(3, 5);
  if (d.length < 5) return `${width}/${aspect}`;
  if (d.length === 5) return `${width}/${aspect}R`;
  return `${width}/${aspect}R${d.slice(5)}`;
}

export function TireSizeInput({
  id,
  name = "size",
  defaultValue = "",
  "aria-invalid": ariaInvalid,
  className,
}: TireSizeInputProps) {
  const [value, setValue] = useState(() =>
    applyMask(defaultValue.replace(/\D/g, "")),
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    const atEnd = e.currentTarget.selectionStart === value.length;
    // When cursor is at end after an eagerly-inserted literal, backspace
    // should remove the literal + the digit before it
    if (atEnd && (value.endsWith("/") || value.endsWith("R"))) {
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
      placeholder="245/40R17"
      maxLength={9}
      aria-invalid={ariaInvalid}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
    />
  );
}
