import { describe, it, expect } from "vitest";
import { buildCalendarDescription } from "./calendar";

describe("buildCalendarDescription", () => {
  it("returns empty string when all fields are null/undefined", () => {
    expect(buildCalendarDescription({})).toBe("");
  });

  it("includes organizing body", () => {
    expect(buildCalendarDescription({ organizingBody: "SCCA" })).toBe(
      "Organizing Body: SCCA",
    );
  });

  it("formats entry fee to 2 decimal places", () => {
    expect(buildCalendarDescription({ entryFee: 65 })).toBe(
      "Entry Fee: $65.00",
    );
    expect(buildCalendarDescription({ entryFee: 65.5 })).toBe(
      "Entry Fee: $65.50",
    );
  });

  it("excludes entry fee when null", () => {
    expect(buildCalendarDescription({ entryFee: null })).toBe("");
  });

  it("includes all provided fields in order", () => {
    const result = buildCalendarDescription({
      organizingBody: "SCCA",
      entryFee: 50,
      runGroup: "Street",
      registrationUrl: "https://example.com",
      notes: "Bring cones",
    });
    expect(result).toBe(
      "Organizing Body: SCCA\nEntry Fee: $50.00\nRun Group/Class: Street\nRegistration URL: https://example.com\nNotes: Bring cones",
    );
  });

  it("skips falsy string fields", () => {
    const result = buildCalendarDescription({
      organizingBody: "",
      runGroup: "Street",
    });
    expect(result).toBe("Run Group/Class: Street");
  });
});
