"use client";

import { useState, useTransition } from "react";
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

export function UrlAutofill({ onFill }: UrlAutofillProps) {
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    if (!url) return;
    const formData = new FormData();
    formData.set("url", url);
    startTransition(async () => {
      const result = await scrapeEventUrl({} as ScrapeActionState, formData);
      if (result.data && Object.keys(result.data).length > 0) {
        onFill(result.data);
        toast.success("Event details fetched");
        setUrl("");
      }
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Auto-fill from URL</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste an event URL to auto-fill details.
      </p>
      <div className="flex gap-2">
        <Label htmlFor="autofill-url" className="sr-only">
          Event URL
        </Label>
        <Input
          id="autofill-url"
          type="url"
          placeholder="https://..."
          className="flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleFetch();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || !url}
          onClick={handleFetch}
        >
          {isPending ? (
            <LoaderIcon className="size-4 animate-spin" aria-hidden />
          ) : (
            "Fetch"
          )}
        </Button>
      </div>
    </div>
  );
}
