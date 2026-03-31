export interface ConsistencyResult {
  stdDev: number;
  rating: "Excellent" | "Good" | "Fair" | "Inconsistent";
}

export function calculateConsistency(
  adjustedTimes: (number | null)[],
): ConsistencyResult | null {
  const valid = adjustedTimes.filter((t): t is number => t !== null);
  if (valid.length < 2) return null;

  const mean = valid.reduce((sum, t) => sum + t, 0) / valid.length;
  const variance =
    valid.reduce((sum, t) => sum + (t - mean) ** 2, 0) / (valid.length - 1);
  const stdDev = Math.sqrt(variance);

  let rating: ConsistencyResult["rating"];
  if (stdDev < 0.5) rating = "Excellent";
  else if (stdDev < 1.0) rating = "Good";
  else if (stdDev < 2.0) rating = "Fair";
  else rating = "Inconsistent";

  return { stdDev, rating };
}
