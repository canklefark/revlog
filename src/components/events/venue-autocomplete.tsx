"use client";

import { useId, useRef, useState } from "react";
import { MapPinIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface VenueOption {
  venueName: string;
  address: string | null;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (venue: VenueOption) => void;
  venues: VenueOption[];
  id?: string;
  placeholder?: string;
}

export function VenueAutocomplete({
  value,
  onChange,
  onSelect,
  venues,
  id,
  placeholder,
}: VenueAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();
  const listboxId = `venue-listbox-${uid}`;

  const query = value.toLowerCase().trim();
  const filtered =
    query.length > 0
      ? venues.filter(
          (v) =>
            v.venueName.toLowerCase().includes(query) && v.venueName !== value,
        )
      : [];

  const showDropdown = open && filtered.length > 0;
  // Clamp activeIndex to current filtered length so it never goes stale
  const clampedIndex =
    activeIndex >= filtered.length ? filtered.length - 1 : activeIndex;

  function selectVenue(venue: VenueOption) {
    onSelect(venue);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (clampedIndex >= 0 && clampedIndex < filtered.length) {
          selectVenue(filtered[clampedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const activeDescendant =
    showDropdown && clampedIndex >= 0
      ? `${listboxId}-option-${clampedIndex}`
      : undefined;

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          // Close only if focus moved outside this component
          if (!listRef.current?.contains(e.relatedTarget)) {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-activedescendant={activeDescendant}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.map((venue, i) => (
            <li
              key={venue.venueName}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === clampedIndex}
            >
              <button
                type="button"
                tabIndex={-1}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === clampedIndex ? "bg-muted/70" : "hover:bg-muted/50"
                }`}
                onClick={() => selectVenue(venue)}
                onFocus={() => setActiveIndex(i)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{venue.venueName}</p>
                  {venue.address && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPinIcon className="size-3 shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
