import { describe, expect, it } from "vitest";
import { formatCurrency, formatCompactCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("should format currency in Vietnamese locale standard", () => {
    const formatted = formatCurrency(15500000);

    const normalized = formatted.replace(/\u00a0/g, " ");
    expect(normalized).toMatch(/15\.500\.000\s?(₫|VND)/);
  });
});

describe("formatCompactCurrency", () => {
  it("should format compact currency under 1 billion", () => {
    const formatted = formatCompactCurrency(950000);
    const normalized = formatted.replace(/\u00a0/g, " ");
    expect(normalized).toMatch(/950\.000\s?(₫|VND)/);
  });

  it("should format compact currency over 1 billion with billion suffix", () => {
    expect(formatCompactCurrency(2400000000)).toBe("2.4 tỷ VND");
  });
});
