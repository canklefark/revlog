import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { Run } from "@prisma/client";

interface SessionNarrativeProps {
  bestTime: number | null;
  previousBest: number | null;
  eventType: string;
  venueName: string | null;
  runCount: number;
  dnfCount: number;
  totalPenalties: number;
  runs: Pick<Run, "adjustedTime" | "runNumber">[];
}

export function SessionNarrative({
  bestTime,
  previousBest,
  eventType,
  venueName,
  runCount,
  dnfCount,
  totalPenalties,
  runs,
}: SessionNarrativeProps) {
  if (bestTime === null || runCount === 0) return null;

  const lines: string[] = [];
  const context = venueName ?? eventType;

  // PB / delta comparison
  if (previousBest === null) {
    lines.push(
      `Your first ${eventType} — ${formatLapTime(bestTime)} is your new benchmark!`,
    );
  } else {
    const delta = previousBest - bestTime;
    if (delta > 0.001) {
      lines.push(
        `Your best today (${formatLapTime(bestTime)}) was ${formatLapTime(delta)} faster than your previous best at ${context}.`,
      );
    } else if (delta < -0.001) {
      lines.push(
        `Your best today (${formatLapTime(bestTime)}) was ${formatLapTime(Math.abs(delta))} slower than your previous best at ${context}.`,
      );
    } else {
      lines.push(
        `Your best today (${formatLapTime(bestTime)}) matched your previous best at ${context}.`,
      );
    }
  }

  // Clean session
  if (totalPenalties === 0 && dnfCount === 0) {
    lines.push(`All ${runCount} runs were clean — zero penalties.`);
  }

  // Run improvement across session (first valid vs last valid)
  const validRuns = runs
    .filter(
      (r): r is typeof r & { adjustedTime: number } => r.adjustedTime !== null,
    )
    .sort((a, b) => a.runNumber - b.runNumber);

  if (validRuns.length >= 3) {
    const firstTime = validRuns[0].adjustedTime;
    const lastTime = validRuns[validRuns.length - 1].adjustedTime;
    const sessionDelta = firstTime - lastTime;
    if (sessionDelta > 0.1) {
      lines.push(
        `You improved ${formatLapTime(sessionDelta)} from your first run to your last.`,
      );
    }
  }

  if (lines.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-1">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}
