import { describe, expect, it } from "vitest";
import { calculateReport } from "./calculations";

const transactions = [
  {
    amount: "1000",
    category_name: null,
    currency: "USD" as const,
    date: "2026-08-10",
    type: "income" as const,
  },
  {
    amount: "200",
    category_name: "Food",
    currency: "USD" as const,
    date: "2026-08-12",
    type: "expense" as const,
  },
  {
    amount: "75",
    category_name: "Food",
    currency: "USD" as const,
    date: "2026-09-02",
    type: "expense" as const,
  },
  {
    amount: "500",
    category_name: null,
    currency: "USD" as const,
    date: "2026-09-03",
    type: "transfer" as const,
  },
  {
    amount: "900000",
    category_name: null,
    currency: "CLP" as const,
    date: "2026-09-03",
    type: "income" as const,
  },
];

describe("calculateReport", () => {
  it("excludes transfers and other currencies from income and expenses", () => {
    const report = calculateReport(
      transactions,
      "3M",
      "5000",
      new Date("2026-09-04T12:00:00Z"),
    );
    expect(report.income).toBe("1000");
    expect(report.expense).toBe("275");
    expect(report.netCashFlow).toBe("725");
    expect(report.savingsRate).toBe("72.5");
  });

  it("groups expenses by category and derives historical net worth", () => {
    const report = calculateReport(
      transactions,
      "3M",
      "5000",
      new Date("2026-09-04T12:00:00Z"),
    );
    expect(report.categories).toEqual([{ amount: "275", name: "Food" }]);
    expect(report.timeline.at(-2)?.netWorth).toBe("5075");
    expect(report.timeline.at(-1)?.netWorth).toBe("5000");
  });

  it("returns no savings rate when income is zero", () => {
    const report = calculateReport(
      transactions.filter((item) => item.type !== "income"),
      "1M",
      "5000",
      new Date("2026-09-04T12:00:00Z"),
    );
    expect(report.savingsRate).toBeNull();
  });
});
