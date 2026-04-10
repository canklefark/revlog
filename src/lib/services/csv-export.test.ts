import { describe, it, expect } from "vitest";
import { modsToCSV, eventsToCSV } from "./csv-export";

const baseMod = {
  id: "1",
  carId: "c1",
  brand: null,
  partNumber: null,
  installDate: null,
  installedBy: null,
  shopName: null,
  cost: null,
  odometerAtInstall: null,
  receiptUrl: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("CSV escaping", () => {
  it("escapes values with commas", () => {
    const result = modsToCSV([
      { ...baseMod, name: "Test, Mod", category: "Engine" },
    ]);
    expect(result).toContain('"Test, Mod"');
  });

  it("escapes values with double quotes", () => {
    const result = modsToCSV([
      { ...baseMod, name: 'Say "hello"', category: "Engine" },
    ]);
    expect(result).toContain('"Say ""hello"""');
  });

  it("handles empty arrays", () => {
    const result = modsToCSV([]);
    // Should have header row only
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
  });

  it("handles null values as empty string", () => {
    const result = modsToCSV([{ ...baseMod, name: "Mod", category: "Other" }]);
    // Nulls should produce empty fields, not "null"
    expect(result).not.toContain("null");
  });
});
