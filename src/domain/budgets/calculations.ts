import type { Currency } from "@/domain/accounts/types";
import type { TransactionDetail } from "@/domain/transactions/types";
import { decimal } from "@/lib/money/decimal";
import type { BudgetProgress, MonthlyBudget } from "./types";

export function calculateBudgetProgress(
  budgets: readonly MonthlyBudget[],
  transactions: readonly TransactionDetail[],
): BudgetProgress[] {
  return budgets.map((budget) => {
    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category_id === budget.category_id &&
          transaction.currency === budget.currency &&
          transaction.date.startsWith(budget.month.slice(0, 7)),
      )
      .reduce(
        (total, transaction) => total.plus(transaction.amount),
        decimal(0),
      );
    const limit = decimal(budget.amount);
    return {
      ...budget,
      percentUsed: spent
        .dividedBy(limit)
        .times(100)
        .toDecimalPlaces(1)
        .toFixed(),
      remaining: limit.minus(spent).toFixed(),
      spent: spent.toFixed(),
    };
  });
}

export function calculateBudgetTotals(
  progress: readonly BudgetProgress[],
  currency: Currency,
) {
  const entries = progress.filter((item) => item.currency === currency);
  const budgeted = entries.reduce(
    (total, item) => total.plus(item.amount),
    decimal(0),
  );
  const spent = entries.reduce(
    (total, item) => total.plus(item.spent),
    decimal(0),
  );
  return {
    budgeted: budgeted.toFixed(),
    remaining: budgeted.minus(spent).toFixed(),
    spent: spent.toFixed(),
  };
}
