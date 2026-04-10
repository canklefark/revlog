import { describe, it, expect } from "vitest";
import { extractPostalCode } from "./extract-postal-code";

describe("extractPostalCode", () => {
  it("extracts US 5-digit zip", () => {
    expect(extractPostalCode("123 Main St, Austin, TX 78701")).toBe("78701");
  });

  it("extracts US zip+4 as 5-digit", () => {
    expect(extractPostalCode("123 Main St, Austin, TX 78701-1234")).toBe(
      "78701",
    );
  });

  it("extracts Canadian postal code without space", () => {
    expect(extractPostalCode("100 Queen St W, Toronto, ON M5H2N2")).toBe(
      "M5H2N2",
    );
  });

  it("extracts Canadian postal code with space", () => {
    expect(extractPostalCode("100 Queen St W, Toronto, ON M5H 2N2")).toBe(
      "M5H2N2",
    );
  });

  it("returns null for no postal code", () => {
    expect(extractPostalCode("somewhere in California")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractPostalCode("")).toBeNull();
  });
});
