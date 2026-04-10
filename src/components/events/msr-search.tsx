"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  SearchIcon,
  LoaderIcon,
  CalendarPlusIcon,
  LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeBadge } from "@/components/events/type-badge";
import { searchMsrEvents } from "@/lib/actions/msr-search";
import { bulkCreateEvents } from "@/lib/actions/import";
import type { MsrEventResult } from "@/lib/services/msr-authenticated-api";

interface MsrSearchProps {
  importedUrls: string[];
  importedMsrIds: string[];
  defaultPostalCode: string | null;
  hasMsrAccount: boolean;
}

const initialState = { data: undefined, error: undefined };

export function MsrSearch({
  importedUrls,
  importedMsrIds,
  defaultPostalCode,
  hasMsrAccount,
}: MsrSearchProps) {
  const router = useRouter();
  const importedUrlSet = new Set(importedUrls);
  const importedMsrIdSet = new Set(importedMsrIds);

  const [searchState, searchDispatch, searchPending] = useActionState(
    searchMsrEvents,
    initialState,
  );
  const [createPending, startCreateTransition] = useTransition();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Clear selection whenever new search results arrive.
  useEffect(() => {
    setSelected(new Set());
  }, [searchState.data]);

  if (!hasMsrAccount) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
        <LinkIcon className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">
          Connect MotorsportReg to search events
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Link your MSR account to browse and add events near you directly from
          RevLog.
        </p>
        <Button asChild size="sm" variant="outline">
          <a href="/api/msr/connect">Connect MSR Account</a>
        </Button>
      </div>
    );
  }

  const events: MsrEventResult[] = searchState.data ?? [];

  function isAlreadyImported(ev: MsrEventResult): boolean {
    if (ev.registrationUrl && importedUrlSet.has(ev.registrationUrl))
      return true;
    if (ev.msrEventId && importedMsrIdSet.has(ev.msrEventId)) return true;
    return false;
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
            `Added ${created} event${created !== 1 ? "s" : ""} as Interested${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
          );
          router.push("/events");
        } else {
          toast.info("All selected events are already in your calendar.");
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <form action={searchDispatch} className="space-y-3">
        <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Search by location</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="postalcode" className="text-xs">
                Postal code
              </Label>
              <Input
                id="postalcode"
                name="postalcode"
                type="text"
                placeholder="e.g. 90210"
                defaultValue={defaultPostalCode ?? ""}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="radius" className="text-xs">
                Radius
              </Label>
              <Select name="radius" defaultValue="300">
                <SelectTrigger id="radius" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 mi</SelectItem>
                  <SelectItem value="100">100 mi</SelectItem>
                  <SelectItem value="150">150 mi</SelectItem>
                  <SelectItem value="200">200 mi</SelectItem>
                  <SelectItem value="300">300 mi</SelectItem>
                  <SelectItem value="500">500 mi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start" className="text-xs">
                From date
              </Label>
              <Input
                id="start"
                name="start"
                type="date"
                defaultValue={today}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {searchState.error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {searchState.error}
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={searchPending}
          className="w-full"
        >
          {searchPending ? (
            <LoaderIcon className="size-4 animate-spin mr-1.5" />
          ) : (
            <SearchIcon className="size-4 mr-1.5" />
          )}
          {searchPending ? "Searching…" : "Search"}
        </Button>
      </form>

      {events.length > 0 && (
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
                    key={ev.msrEventId ?? ev.registrationUrl ?? i}
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
                Add {selected.size > 0 ? selected.size : ""} as Interested
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
