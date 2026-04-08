"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type TextSize = "compact" | "normal" | "large";

const STORAGE_KEY = "revlog-text-size";

const TextSizeContext = createContext<{
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}>({ textSize: "normal", setTextSize: () => {} });

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window === "undefined") return "normal";
    const stored = localStorage.getItem(STORAGE_KEY) as TextSize | null;
    return stored === "compact" || stored === "large" ? stored : "normal";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
    localStorage.setItem(STORAGE_KEY, textSize);
  }, [textSize]);

  return (
    <TextSizeContext.Provider
      value={{ textSize, setTextSize: setTextSizeState }}
    >
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  return useContext(TextSizeContext);
}
