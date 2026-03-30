import { describe, it, expect } from "vitest";
import {
  calculateAdjustedTime,
  formatLapTime,
  parseLapTime,
} from "./penalty-calc";

describe("calculateAdjustedTime", () => {
  it("returns rawTime when no penalties", () => {
    expect(calculateAdjustedTime(63.5, [], false)).toBe(63.5);
  });

  it("adds penalty seconds", () => {
    expect(
      calculateAdjustedTime(
        63.5,
        [{ type: "Cone", count: 2, secondsEach: 2 }],
        false,
      ),
    ).toBe(67.5);
  });

  it("handles multiple penalty types", () => {
    const penalties = [
      { type: "Cone", count: 1, secondsEach: 2 },
      { type: "Gate", count: 2, secondsEach: 5 },
    ];
    expect(calculateAdjustedTime(60.0, penalties, false)).toBe(72.0);
  });

  it("returns null for DNF regardless of penalties", () => {
    expect(
      calculateAdjustedTime(
        63.5,
        [{ type: "Cone", count: 1, secondsEach: 2 }],
        true,
      ),
    ).toBeNull();
  });

  it("returns null for DNF with no penalties", () => {
    expect(calculateAdjustedTime(63.5, [], true)).toBeNull();
  });

  it("handles zero-count penalties", () => {
    expect(
      calculateAdjustedTime(
        63.5,
        [{ type: "Cone", count: 0, secondsEach: 2 }],
        false,
      ),
    ).toBe(63.5);
  });
});

describe("formatLapTime", () => {
  it("formats sub-minute time", () => {
    expect(formatLapTime(63.123)).toBe("1:03.123");
  });

  it("formats time under 60s", () => {
    expect(formatLapTime(59.999)).toBe("59.999");
  });

  it("formats exactly 60s", () => {
    expect(formatLapTime(60.0)).toBe("1:00.000");
  });

  it("formats with minutes", () => {
    expect(formatLapTime(125.456)).toBe("2:05.456");
  });
});

describe("parseLapTime", () => {
  it("parses m:ss.xxx format", () => {
    expect(parseLapTime("1:03.123")).toBeCloseTo(63.123);
  });

  it("parses plain seconds", () => {
    expect(parseLapTime("59.999")).toBeCloseTo(59.999);
  });

  it("returns null for invalid input", () => {
    expect(parseLapTime("abc")).toBeNull();
  });

  it("parses 2-minute time", () => {
    expect(parseLapTime("2:05.456")).toBeCloseTo(125.456);
  });
});
