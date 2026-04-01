import { describe, it, expect } from "vitest";
import { inferEventType } from "./infer-event-type";

describe("inferEventType", () => {
  it("matches Autocross", () => {
    expect(inferEventType("Region Autocross #3")).toBe("Autocross");
    expect(inferEventType("SCCA autocross event")).toBe("Autocross");
  });

  it("matches RallyCross before Autocross", () => {
    expect(inferEventType("RallyCross Championship")).toBe("RallyCross");
    expect(inferEventType("rallycross")).toBe("RallyCross");
  });

  it("matches HPDE", () => {
    expect(inferEventType("HPDE Weekend at VIR")).toBe("HPDE");
    expect(inferEventType("hpde intro session")).toBe("HPDE");
  });

  it("matches Track Day with spaces", () => {
    expect(inferEventType("Track Day at Thunderhill")).toBe("Track Day");
    expect(inferEventType("Open track day")).toBe("Track Day");
  });

  it("matches Time Attack", () => {
    expect(inferEventType("Time Attack Series Round 2")).toBe("Time Attack");
    expect(inferEventType("time attack")).toBe("Time Attack");
  });

  it("matches Test & Tune variants", () => {
    expect(inferEventType("Test & Tune Night")).toBe("Test & Tune");
    expect(inferEventType("test and tune")).toBe("Test & Tune");
    expect(inferEventType("test+tune")).toBe("Test & Tune");
  });

  it("matches Practice Session", () => {
    expect(inferEventType("Open Practice Session")).toBe("Practice Session");
  });

  it("matches Hill Climb", () => {
    expect(inferEventType("Mt. Washington Hill Climb")).toBe("Hill Climb");
    expect(inferEventType("hill climb")).toBe("Hill Climb");
  });

  it("matches Endurance", () => {
    expect(inferEventType("24hr Endurance Race")).toBe("Endurance");
  });

  it("matches Drift", () => {
    expect(inferEventType("Formula Drift Round 1")).toBe("Drift");
  });

  it("matches Drag", () => {
    expect(inferEventType("Drag Night at the Strip")).toBe("Drag");
  });

  it("is case-insensitive", () => {
    expect(inferEventType("AUTOCROSS")).toBe("Autocross");
    expect(inferEventType("Hpde")).toBe("HPDE");
  });

  it("returns undefined when no match", () => {
    expect(inferEventType("Spring Championship")).toBeUndefined();
    expect(inferEventType("")).toBeUndefined();
    expect(inferEventType("Club Event #5")).toBeUndefined();
  });

  it("does not match partial words without word boundary", () => {
    // 'drag' in 'dragging' — \b prevents false match
    expect(inferEventType("dragging weather")).toBeUndefined();
  });
});
