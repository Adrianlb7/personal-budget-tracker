import type { TransactionDetail } from "@/domain/transactions/types";
import { calculateBudgetProgress, calculateBudgetTotals } from "./calculations";
import type { MonthlyBudget } from "./types";

const budget: MonthlyBudget = {
  amount: "300.30",
  category_id: "category-1",
  category_name: "Groceries",
  created_at: "",
  currency: "USD",
  id: "budget-1",
  month: "2026-09-01",
  updated_at: "",
  user_id: "user-1",
};

function transaction(
  amount: string,
  overrides: Partial<TransactionDetail> = {},
): TransactionDetail {
  return {
    account_id: "account-1",
    account_name: "Checking",
    amount,
    category_id: "category-1",
    category_name: "Groceries",
    created_at: "",
    currency: "USD",
    date: "2026-09-10",
    description: "Expense",
    destination_account_id: null,
    destination_account_name: null,
    destination_amount: null,
    destination_currency: null,
    direction: "outflow",
    id: crypto.randomUUID(),
    metadata: {},
    notes: null,
    type: "expense",
    user_id: "user-1",
    ...overrides,
  };
}

describe("budget calculations", () => {
  it("calculates category progress with exact decimal math", () => {
    expect(
      calculateBudgetProgress(
        [budget],
        [transaction("100.10"), transaction("50.20")],
      ),
    ).toEqual([
      {
        ...budget,
        percentUsed: "50",
        remaining: "150",
        spent: "150.3",
      },
    ]);
  });

  it("excludes transfers, other months, categories, and currencies", () => {
    const progress = calculateBudgetProgress(
      [budget],
      [
        transaction("40"),
        transaction("100", { type: "transfer" }),
        transaction("100", { date: "2026-08-31" }),
        transaction("100", { category_id: "category-2" }),
        transaction("100", { currency: "CLP" }),
      ],
    );
    expect(progress[0].spent).toBe("40");
  });

  it("keeps negative remaining amounts when a budget is exceeded", () => {
    const progress = calculateBudgetProgress([budget], [transaction("400.30")]);
    expect(progress[0].remaining).toBe("-100");
    expect(progress[0].percentUsed).toBe("133.3");
  });

  it("totals only the requested currency", () => {
    const progress = calculateBudgetProgress(
      [budget, { ...budget, id: "budget-2", currency: "CLP", amount: "500" }],
      [transaction("100.10")],
    );
    expect(calculateBudgetTotals(progress, "USD")).toEqual({
      budgeted: "300.3",
      remaining: "200.2",
      spent: "100.1",
    });
  });
});
