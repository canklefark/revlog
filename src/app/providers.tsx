"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TextSizeProvider } from "@/components/layout/text-size-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TextSizeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </TextSizeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
