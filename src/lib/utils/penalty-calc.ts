export interface PenaltyItem {
  type: string;
  count: number;
  secondsEach: number;
}

export function calculateAdjustedTime(
  rawTime: number,
  penalties: PenaltyItem[],
  isDnf: boolean,
): number | null {
  if (isDnf) return null;
  const penaltyTotal = penalties.reduce(
    (sum, p) => sum + p.count * p.secondsEach,
    0,
  );
  return rawTime + penaltyTotal;
}

export function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  const secs = remaining.toFixed(3).padStart(6, "0");
  if (minutes > 0) {
    return `${minutes}:${secs}`;
  }
  return secs;
}

export function parseLapTime(value: string): number | null {
  const colonIdx = value.indexOf(":");
  if (colonIdx !== -1) {
    const minutes = parseInt(value.slice(0, colonIdx), 10);
    const secs = parseFloat(value.slice(colonIdx + 1));
    if (isNaN(minutes) || isNaN(secs)) return null;
    return minutes * 60 + secs;
  }
  const secs = parseFloat(value);
  if (isNaN(secs)) return null;
  return secs;
}
