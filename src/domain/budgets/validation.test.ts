import { budgetSchema } from "./validation";

describe("budgetSchema", () => {
  it("normalizes comma decimals", () => {
    expect(
      budgetSchema.parse({
        amount: "120,50",
        category: "Groceries",
        currency: "USD",
        month: "2026-09",
      }).amount,
    ).toBe("120.50");
  });

  it("rejects invalid months and zero limits", () => {
    expect(
      budgetSchema.safeParse({
        amount: "0",
        category: "Groceries",
        currency: "USD",
        month: "2026-13",
      }).success,
    ).toBe(false);
  });
});
