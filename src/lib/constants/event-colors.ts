import type { EventType } from "./event-types";

export type ColorPair = {
  bg: string;
  text: string;
  badge: string;
};

export const EVENT_TYPE_COLORS: Record<EventType, ColorPair> = {
  Autocross: {
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    badge:
      "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  },
  RallyCross: {
    bg: "bg-red-500/15 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  },
  HPDE: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    badge:
      "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  "Track Day": {
    bg: "bg-violet-500/15 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    badge:
      "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  },
  "Time Attack": {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  Drag: {
    bg: "bg-yellow-500/15 dark:bg-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    badge:
      "bg-yellow-500/15 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
  },
  "Test & Tune": {
    bg: "bg-lime-500/15 dark:bg-lime-500/20",
    text: "text-lime-600 dark:text-lime-400",
    badge:
      "bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400",
  },
  "Practice Session": {
    bg: "bg-teal-500/15 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    badge:
      "bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  },
  "Hill Climb": {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  Endurance: {
    bg: "bg-cyan-500/15 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    badge:
      "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  },
  Drift: {
    bg: "bg-pink-500/15 dark:bg-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    badge:
      "bg-pink-500/15 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
  },
  Other: {
    bg: "bg-slate-500/15 dark:bg-slate-500/20",
    text: "text-slate-600 dark:text-slate-400",
    badge:
      "bg-slate-500/15 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  },
};
