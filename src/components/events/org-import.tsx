"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { LinkIcon, LoaderIcon, CalendarPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TypeBadge } from "@/components/events/type-badge";
import { fetchOrgEvents, bulkCreateEvents } from "@/lib/actions/import";
import type { ScrapedEventData } from "@/lib/services/motorsportreg-scraper";

interface OrgImportProps {
  // Plain array (serializable from server component)
  importedUrls: string[];
}

const initialFetchState = { data: undefined, error: undefined };

export function OrgImport({ importedUrls }: OrgImportProps) {
  const router = useRouter();
  const importedSet = new Set(importedUrls);

  // Step 1: fetch org events via form action
  const [fetchState, fetchDispatch, fetchPending] = useActionState(
    fetchOrgEvents,
    initialFetchState,
  );

  // Step 2: bulk create via direct action call in a transition
  const [createPending, startCreateTransition] = useTransition();

  // Indices of selected (unchecked) events
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const events: ScrapedEventData[] = fetchState.data ?? [];

  function isAlreadyImported(ev: ScrapedEventData): boolean {
    return !!(ev.registrationUrl && importedSet.has(ev.registrationUrl));
  }

  const selectableIndices = events
    .map((_, i) => i)
    .filter((i) => !isAlreadyImported(events[i]!));
  const selectableCount = selectableIndices.length;

  function toggleAll() {
    if (selected.size === selectableCount) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIndices));
    }
  }

  function toggleOne(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleImport() {
    const selectedEvents = [...selected].map((i) => events[i]!);
    if (selectedEvents.length === 0) return;

    const fd = new FormData();
    fd.set("events", JSON.stringify(selectedEvents));

    startCreateTransition(async () => {
      const result = await bulkCreateEvents({}, fd);
      if (result.data) {
        const { created, skipped } = result.data;
        if (created > 0) {
          toast.success(
            `Imported ${created} event${created !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
          );
          router.push("/events");
        } else {
          toast.info("All selected events already exist in your calendar.");
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  const hasResults = events.length > 0;

  return (
    <div className="space-y-6">
      {/* Step 1: org URL input */}
      <form action={fetchDispatch} className="space-y-3">
        <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Organization URL or ID</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a motorsportreg.com URL for an org or event, or paste the
            organization ID directly.
          </p>
          <div className="flex gap-2">
            <Label htmlFor="orgInput" className="sr-only">
              MSR Organization URL or ID
            </Label>
            <Input
              id="orgInput"
              name="orgInput"
              type="text"
              placeholder="https://www.motorsportreg.com/... or org UUID"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={fetchPending}
            >
              {fetchPending ? (
                <LoaderIcon className="size-4 animate-spin" aria-hidden />
              ) : (
                "Fetch"
              )}
            </Button>
          </div>
        </div>

        {fetchState.error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {fetchState.error}
          </p>
        )}
      </form>

      {/* Step 2: event selection */}
      {hasResults && (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {events.length} event{events.length !== 1 ? "s" : ""} found
              </p>
              {selectableCount > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  {selected.size === selectableCount
                    ? "Deselect all"
                    : "Select all"}
                </button>
              )}
            </div>

            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {events.map((ev, i) => {
                const alreadyImported = isAlreadyImported(ev);
                const isChecked = selected.has(i);

                return (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      alreadyImported
                        ? "opacity-50 cursor-default"
                        : "cursor-pointer hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0 accent-primary"
                      checked={isChecked}
                      disabled={alreadyImported}
                      onChange={() => !alreadyImported && toggleOne(i)}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium leading-tight">
                          {ev.name ?? "Unnamed event"}
                        </span>
                        {alreadyImported && (
                          <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            Already added
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        {ev.startDate && (
                          <span>
                            {format(parseISO(ev.startDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {ev.type && <TypeBadge type={ev.type} />}
                        {(ev.venueName ?? ev.address) && (
                          <span className="truncate">
                            {ev.venueName ?? ev.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {selected.size} selected
              </p>
              <Button
                type="button"
                size="sm"
                disabled={selected.size === 0 || createPending}
                onClick={handleImport}
              >
                {createPending ? (
                  <LoaderIcon className="size-4 animate-spin mr-1.5" />
                ) : (
                  <CalendarPlusIcon className="size-4 mr-1.5" />
                )}
                Import {selected.size > 0 ? selected.size : ""} event
                {selected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
