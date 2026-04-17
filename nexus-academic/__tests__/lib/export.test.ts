import { describe, it, expect } from "vitest";

// ─── Pure helper tests for CSV escape logic ───────────────────────────────────
// We test the escape logic directly since the DOM-dependent download part
// cannot run in a Node/vitest environment without a browser.

function escapeCsvField(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns plain string for simple values", () => {
    expect(escapeCsvField("CSE101")).toBe("CSE101");
    expect(escapeCsvField(42)).toBe("42");
  });

  it("wraps in quotes when value contains a comma", () => {
    expect(escapeCsvField("Final Project, Part 2")).toBe(
      '"Final Project, Part 2"'
    );
  });

  it("escapes internal double-quotes by doubling them", () => {
    expect(escapeCsvField('He said "hello"')).toBe('"He said ""hello"""');
  });

  it("wraps in quotes when value contains a newline", () => {
    expect(escapeCsvField("Line1\nLine2")).toBe('"Line1\nLine2"');
  });
});

// ─── Priority score formatting ──────────────────────────────────────────────

function formatPriority(priority: number): string {
  if (priority === Number.POSITIVE_INFINITY) return "OVERDUE";
  if (priority < 1) return priority.toFixed(3);
  return priority.toFixed(2);
}

describe("formatPriority", () => {
  it("returns OVERDUE for Infinity", () => {
    expect(formatPriority(Number.POSITIVE_INFINITY)).toBe("OVERDUE");
  });

  it("uses 3 decimal places for values < 1", () => {
    expect(formatPriority(0.5)).toBe("0.500");
    expect(formatPriority(0.123456)).toBe("0.123");
  });

  it("uses 2 decimal places for values >= 1", () => {
    expect(formatPriority(1.5)).toBe("1.50");
    expect(formatPriority(10)).toBe("10.00");
  });
});

export {};
