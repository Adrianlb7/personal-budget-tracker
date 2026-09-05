import { describe, expect, it } from "vitest";
import {
  categoryNameKey,
  categoryOptions,
  normalizeCategoryName,
} from "./catalog";

describe("category catalog", () => {
  it("normalizes whitespace and casing for duplicate detection", () => {
    expect(normalizeCategoryName("  Home   repairs ")).toBe("Home repairs");
    expect(categoryNameKey(" FOOD ")).toBe("food");
  });

  it("keeps existing spelling and adds defaults without duplicates", () => {
    const options = categoryOptions("expense", ["food", "Custom"]);

    expect(options).toContain("food");
    expect(options).toContain("Custom");
    expect(options).toContain("Groceries");
    expect(
      options.filter((name) => name.toLowerCase() === "food"),
    ).toHaveLength(1);
  });
});
