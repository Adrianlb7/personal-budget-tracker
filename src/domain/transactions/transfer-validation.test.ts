import { transferSchema } from "./transfer-validation";

const valid = {
  amount: "300,25",
  date: "2026-09-04",
  description: "Move to savings",
  destinationAccountId: "44444444-4444-4444-8444-444444444444",
  notes: "",
  sourceAccountId: "33333333-3333-4333-8333-333333333333",
};

describe("transferSchema", () => {
  it("normalizes comma decimals", () => {
    expect(transferSchema.parse(valid).amount).toBe("300.25");
  });

  it("normalizes a manual CLP per USD rate", () => {
    expect(
      transferSchema.parse({ ...valid, exchangeRate: "910,25" }).exchangeRate,
    ).toBe("910.25");
  });

  it("requires different accounts", () => {
    const result = transferSchema.safeParse({
      ...valid,
      destinationAccountId: valid.sourceAccountId,
    });
    expect(result.success).toBe(false);
  });

  it("uses the placeholder when description is blank", () => {
    expect(
      transferSchema.parse({ ...valid, description: " " }).description,
    ).toBe("Move to savings");
  });
});
