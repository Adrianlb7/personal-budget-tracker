import {
  transactionDescriptionOrDefault,
  transactionSchema,
} from "./validation";

const valid = {
  accountId: "33333333-3333-4333-8333-333333333333",
  amount: "125,50",
  category: "Salary",
  date: "2026-09-04",
  description: "September salary",
  notes: "",
  type: "income",
};

describe("transactionSchema", () => {
  it("preserves fields and normalizes comma decimals", () => {
    expect(transactionSchema.parse(valid).amount).toBe("125.50");
  });

  it.each([
    ["income", "September salary"],
    ["expense", "Groceries"],
  ])("uses the %s placeholder when description is blank", (type, expected) => {
    expect(transactionDescriptionOrDefault(" ", type)).toBe(expected);
  });

  it.each(["0", "-1", "1,000.25", "1.000,25"])(
    "rejects invalid amount %s without throwing",
    (amount) => {
      expect(() =>
        transactionSchema.safeParse({ ...valid, amount }),
      ).not.toThrow();
      expect(transactionSchema.safeParse({ ...valid, amount }).success).toBe(
        false,
      );
    },
  );
});
