"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  EVENT_TYPES,
  REGISTRATION_STATUSES,
} from "@/lib/constants/event-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "all";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentDate = searchParams.get("date") ?? "upcoming";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "upcoming") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={currentDate}
        onValueChange={(v) => updateFilter("date", v)}
      >
        <SelectTrigger className="w-auto min-w-[110px] h-8 text-xs">
          <SelectValue placeholder="When" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="past">Past</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentType}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
          <SelectValue placeholder="Event type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentStatus}
        onValueChange={(v) => updateFilter("status", v)}
      >
        <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {REGISTRATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
