import { decimal } from "@/lib/money/decimal";
import type { TransactionType } from "./types";

export type FinancialEntry = { amount: string; type: TransactionType };

export function calculateTransactionTotals(entries: readonly FinancialEntry[]) {
  const totals = entries.reduce(
    (result, entry) => ({
      expense:
        entry.type === "expense"
          ? result.expense.plus(entry.amount)
          : result.expense,
      income:
        entry.type === "income"
          ? result.income.plus(entry.amount)
          : result.income,
    }),
    { expense: decimal(0), income: decimal(0) },
  );

  return { expense: totals.expense.toFixed(), income: totals.income.toFixed() };
}
