import type { EventType } from "@/lib/constants/event-types";

// Ordered from most specific to least to avoid false matches.
// Multi-word and hyphenated variants are checked before shorter substrings.
const PATTERNS: [RegExp, EventType][] = [
  [/\brallycross\b/i, "RallyCross"],
  [/\bhpde\b/i, "HPDE"],
  [/\btrack\s+day\b/i, "Track Day"],
  [/\btime\s+attack\b/i, "Time Attack"],
  [/\btest\s*[&+and]*\s*tune\b/i, "Test & Tune"],
  [/\bpractice\s+session\b/i, "Practice Session"],
  [/\bhill\s+climb\b/i, "Hill Climb"],
  [/\bendurance\b/i, "Endurance"],
  [/\bautocross\b/i, "Autocross"],
  [/\bdrift\b/i, "Drift"],
  [/\bdrag\b/i, "Drag"],
];

/**
 * Infers an EventType from free text (typically an event name or description).
 * Returns undefined when no keyword matches — does NOT fall back to "Other".
 */
export function inferEventType(text: string): EventType | undefined {
  for (const [pattern, type] of PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return undefined;
}
