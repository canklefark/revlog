import { describe, it, expect } from "vitest";
import { calculateConsistency } from "./consistency";

describe("calculateConsistency", () => {
  it("returns null for empty array", () => {
    expect(calculateConsistency([])).toBeNull();
  });

  it("returns null for single time", () => {
    expect(calculateConsistency([63.5])).toBeNull();
  });

  it("returns null when only DNFs", () => {
    expect(calculateConsistency([null, null, null])).toBeNull();
  });

  it("returns null when fewer than 2 valid times", () => {
    expect(calculateConsistency([null, 63.5, null])).toBeNull();
  });

  it("rates identical times as Excellent", () => {
    const result = calculateConsistency([63.5, 63.5, 63.5]);
    expect(result?.stdDev).toBe(0);
    expect(result?.rating).toBe("Excellent");
  });

  it("rates very consistent times as Excellent", () => {
    const result = calculateConsistency([63.0, 63.2, 63.4, 63.1]);
    expect(result?.rating).toBe("Excellent");
  });

  it("ignores DNF runs", () => {
    const withDnf = calculateConsistency([63.0, null, 63.2, 63.1]);
    const withoutDnf = calculateConsistency([63.0, 63.2, 63.1]);
    expect(withDnf?.stdDev).toBeCloseTo(withoutDnf!.stdDev, 5);
  });

  it("rates inconsistent times correctly", () => {
    const result = calculateConsistency([60.0, 65.0, 58.0, 70.0]);
    expect(result?.rating).toBe("Inconsistent");
  });

  it("rates moderately consistent times as Fair", () => {
    const result = calculateConsistency([63.0, 64.5, 63.5, 65.0]);
    expect(["Fair", "Good"]).toContain(result?.rating);
  });
});
