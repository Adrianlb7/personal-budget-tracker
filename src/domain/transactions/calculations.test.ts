import { calculateTransactionTotals } from "./calculations";

describe("calculateTransactionTotals", () => {
  it("separates income and expenses deterministically", () => {
    expect(
      calculateTransactionTotals([
        { amount: "1000.10", type: "income" },
        { amount: "0.20", type: "income" },
        { amount: "600.05", type: "expense" },
        { amount: "300", type: "transfer" },
      ]),
    ).toEqual({ expense: "600.05", income: "1000.3" });
  });

  it("excludes transfers from income and expenses", () => {
    expect(
      calculateTransactionTotals([{ amount: "999.99", type: "transfer" }]),
    ).toEqual({ expense: "0", income: "0" });
  });
});
