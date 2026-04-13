"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SessionTabsProps {
  eventId: string;
  sessionLabels: string[];
  activeSession: string | null;
}

export function SessionTabs({
  eventId,
  sessionLabels,
  activeSession,
}: SessionTabsProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function navigate(session: string | null) {
    const url =
      session === null
        ? `/events/${eventId}/session`
        : `/events/${eventId}/session?session=${encodeURIComponent(session)}`;
    router.push(url);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setPopoverOpen(false);
    setNewLabel("");
    navigate(label);
  }

  const tabs = [
    { key: null, label: "All" },
    ...sessionLabels.map((l) => ({ key: l, label: l })),
  ];

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <div className="flex items-end gap-0 border-b border-border flex-1 min-w-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key ?? "__all__"}
            type="button"
            onClick={() => navigate(key)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0",
              activeSession === key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {activeSession === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 px-2">
            <PlusIcon className="size-3.5 mr-1" />
            <span className="text-xs">Session</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-label">Session name</Label>
              <Input
                id="session-label"
                placeholder="e.g. Morning Heat"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={!newLabel.trim()}
            >
              Switch to session
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
