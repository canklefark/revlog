"use client";

import { useActionState, useEffect } from "react";
import { LinkIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scrapeEventUrl, type ScrapeActionState } from "@/lib/actions/scrape";
import type { ScrapedEventData } from "@/lib/services/motorsportreg-scraper";

interface UrlAutofillProps {
  onFill: (data: Partial<ScrapedEventData>) => void;
}

const initialState: ScrapeActionState = {};

export function UrlAutofill({ onFill }: UrlAutofillProps) {
  const [state, formAction, isPending] = useActionState(
    scrapeEventUrl,
    initialState,
  );

  useEffect(() => {
    if (state.data && Object.keys(state.data).length > 0) {
      onFill(state.data);
      toast.success("Event details fetched");
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Auto-fill from URL</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a MotorsportReg event URL to auto-fill details.
      </p>
      <form action={formAction} className="flex gap-2">
        <Label htmlFor="autofill-url" className="sr-only">
          MotorsportReg URL
        </Label>
        <Input
          id="autofill-url"
          name="url"
          type="url"
          placeholder="https://www.motorsportreg.com/events/..."
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <LoaderIcon className="size-4 animate-spin" aria-hidden />
          ) : (
            "Fetch"
          )}
        </Button>
      </form>
    </div>
  );
}
