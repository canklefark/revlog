"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  parseISO,
  startOfDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_COLORS } from "@/lib/constants/event-colors";
import type { EventType } from "@/lib/constants/event-types";

interface CalendarEvent {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string | null;
  registrationStatus: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function CalendarView({ events }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // getDay returns 0=Sun … 6=Sat, use as leading blank cells
  const startPadding = getDay(monthStart);

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((event) => {
      const start = startOfDay(parseISO(event.startDate));
      const end = event.endDate ? startOfDay(parseISO(event.endDate)) : start;
      return isWithinInterval(day, { start, end }) || isSameDay(day, start);
    });
  }

  const today = new Date();

  // Days in the current month that have at least one event (for agenda list)
  const daysWithEvents = days.filter((day) => getEventsForDay(day).length > 0);

  return (
    <div>
      {/* Month navigation — shared by both views */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h2 className="text-base font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      {/* Mobile agenda list — visible below md breakpoint */}
      <div className="md:hidden">
        {daysWithEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No events this month.
          </p>
        ) : (
          <div>
            {daysWithEvents.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day.toISOString()}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2">
                    {format(day, "EEEE, MMM d")}
                  </p>
                  <div className="space-y-1.5 pb-2">
                    {dayEvents.map((event) => {
                      const colors = EVENT_TYPE_COLORS[event.type as EventType];
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex items-center justify-between w-full rounded-md border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium truncate pr-3">
                            {event.name}
                          </span>
                          <span
                            className={`shrink-0 text-xs px-2 py-0.5 rounded ${
                              colors?.bg ?? "bg-muted"
                            } ${colors?.text ?? "text-foreground"}`}
                          >
                            {event.type}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop calendar grid — visible at md and up */}
      <div className="hidden md:block">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-l border-t border-border">
          {/* Leading blank padding cells */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="border-r border-b border-border min-h-[80px] bg-muted/20"
            />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-border min-h-[80px] p-1 ${
                  isToday ? "bg-muted/30" : ""
                }`}
              >
                <div
                  className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = EVENT_TYPE_COLORS[event.type as EventType];
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className={`block truncate text-xs px-1 py-0.5 rounded ${
                          colors?.bg ?? "bg-muted"
                        } ${colors?.text ?? "text-foreground"} hover:opacity-80 transition-opacity`}
                      >
                        {event.name}
                      </Link>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend — always visible */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(EVENT_TYPE_COLORS) as EventType[]).map((type) => {
          const colors = EVENT_TYPE_COLORS[type];
          return (
            <span
              key={type}
              className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}
            >
              {type}
            </span>
          );
        })}
      </div>
    </div>
  );
}
