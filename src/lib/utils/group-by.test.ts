import { describe, it, expect } from "vitest";
import { groupByKey } from "./group-by";

describe("groupByKey", () => {
  it("groups items by key alphabetically", () => {
    const items = [
      { name: "A", cat: "Suspension" },
      { name: "B", cat: "Brakes" },
      { name: "C", cat: "Suspension" },
    ];
    const result = groupByKey(items, (i) => i.cat);
    expect(Object.keys(result)).toEqual(["Brakes", "Suspension"]);
    expect(result["Brakes"]).toHaveLength(1);
    expect(result["Suspension"]).toHaveLength(2);
  });

  it("places null keys into Uncategorized, sorted last", () => {
    const items = [
      { name: "A", cat: null },
      { name: "B", cat: "Engine" },
    ];
    const result = groupByKey(items, (i) => i.cat);
    const keys = Object.keys(result);
    expect(keys[0]).toBe("Engine");
    expect(keys[keys.length - 1]).toBe("Uncategorized");
  });

  it("places undefined keys into Uncategorized", () => {
    const items = [{ name: "A", cat: undefined }];
    const result = groupByKey(items, (i) => i.cat);
    expect(result["Uncategorized"]).toHaveLength(1);
  });

  it("supports a custom fallback key", () => {
    const items = [{ name: "A", cat: null }];
    const result = groupByKey(items, (i) => i.cat, "Other");
    expect(result["Other"]).toHaveLength(1);
    expect(result["Uncategorized"]).toBeUndefined();
  });

  it("returns empty object for empty input", () => {
    expect(groupByKey([], (i: { cat: string }) => i.cat)).toEqual({});
  });

  it("preserves insertion order within each group", () => {
    const items = [
      { name: "first", cat: "Engine" },
      { name: "second", cat: "Engine" },
    ];
    const result = groupByKey(items, (i) => i.cat);
    expect(result["Engine"].map((i) => i.name)).toEqual(["first", "second"]);
  });
});
