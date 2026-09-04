import {
  calculateAvailableByCurrency,
  calculateMonthlyMetrics,
  calculateNetWorthByCurrency,
  calculateSpendingTrend,
  calculateWeeklySpendingTrend,
} from "./calculations";

describe("dashboard calculations", () => {
  it("counts only cash and checking as available money", () => {
    expect(
      calculateAvailableByCurrency([
        {
          currency: "USD",
          current_balance: "125.50",
          opening_balance: "0",
          type: "checking",
        },
        {
          currency: "USD",
          current_balance: "24.50",
          opening_balance: "0",
          type: "cash",
        },
        {
          currency: "USD",
          current_balance: "1000",
          opening_balance: "0",
          type: "savings",
        },
      ]),
    ).toEqual([{ amount: "150", currency: "USD" }]);
  });

  it("keeps net worth separated by currency", () => {
    expect(
      calculateNetWorthByCurrency([
        { currency: "USD", current_balance: "700.10", opening_balance: "0" },
        { currency: "USD", current_balance: "299.90", opening_balance: "0" },
        { currency: "CLP", current_balance: "500000", opening_balance: "0" },
      ]),
    ).toEqual([
      { amount: "1000", currency: "USD" },
      { amount: "500000", currency: "CLP" },
    ]);
  });

  it("excludes transfers and calculates savings without floating point", () => {
    expect(
      calculateMonthlyMetrics(
        [
          {
            amount: "1000.10",
            currency: "USD",
            date: "2026-09-01",
            type: "income",
          },
          {
            amount: "300",
            currency: "USD",
            date: "2026-09-02",
            type: "transfer",
          },
          {
            amount: "600.05",
            currency: "USD",
            date: "2026-09-03",
            type: "expense",
          },
        ],
        "USD",
        "2026-09",
      ),
    ).toEqual({
      expense: "600.05",
      income: "1000.1",
      saved: "400.05",
      savingsRate: "40",
    });
  });

  it("returns no savings rate when income is zero", () => {
    expect(
      calculateMonthlyMetrics([], "USD", "2026-09").savingsRate,
    ).toBeNull();
  });

  it("builds an expense-only monthly trend", () => {
    expect(
      calculateSpendingTrend(
        [
          {
            amount: "20.10",
            currency: "USD",
            date: "2026-08-03",
            type: "expense",
          },
          {
            amount: "10.20",
            currency: "USD",
            date: "2026-08-04",
            type: "expense",
          },
          {
            amount: "999",
            currency: "USD",
            date: "2026-08-05",
            type: "transfer",
          },
        ],
        "USD",
        [{ key: "2026-08", label: "Aug" }],
      ),
    ).toEqual([{ amount: "30.3", key: "2026-08", label: "Aug" }]);
  });

  it("groups weekly spending into exact date ranges", () => {
    expect(
      calculateWeeklySpendingTrend(
        [
          {
            amount: "10.10",
            currency: "USD",
            date: "2026-08-31",
            type: "expense",
          },
          {
            amount: "20.20",
            currency: "USD",
            date: "2026-09-06",
            type: "expense",
          },
          {
            amount: "50",
            currency: "USD",
            date: "2026-09-07",
            type: "expense",
          },
        ],
        "USD",
        [
          {
            end: "2026-09-06",
            key: "2026-08-31",
            label: "Aug 31",
            start: "2026-08-31",
          },
        ],
      ),
    ).toEqual([{ amount: "30.3", key: "2026-08-31", label: "Aug 31" }]);
  });
});
