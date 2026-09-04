import type { AccountType, Currency } from "@/domain/accounts/types";
import type { TransactionType } from "@/domain/transactions/types";
import { decimal } from "@/lib/money/decimal";

export type DashboardAccount = {
  currency: Currency;
  current_balance?: string;
  opening_balance: string;
  type?: AccountType;
};

export type DashboardTransaction = {
  amount: string;
  currency: Currency;
  date: string;
  type: TransactionType;
};

export function calculateNetWorthByCurrency(
  accounts: readonly DashboardAccount[],
) {
  const totals = new Map<Currency, ReturnType<typeof decimal>>();
  for (const account of accounts) {
    const balance = account.current_balance ?? account.opening_balance;
    totals.set(
      account.currency,
      (totals.get(account.currency) ?? decimal(0)).plus(balance),
    );
  }
  return [...totals.entries()].map(([currency, value]) => ({
    amount: value.toFixed(),
    currency,
  }));
}

export function calculateAvailableByCurrency(
  accounts: readonly DashboardAccount[],
) {
  return calculateNetWorthByCurrency(
    accounts.filter(
      (account) => account.type === "cash" || account.type === "checking",
    ),
  );
}

export function calculateMonthlyMetrics(
  transactions: readonly DashboardTransaction[],
  currency: Currency,
  month: string,
) {
  const totals = transactions.reduce(
    (result, transaction) => {
      if (
        transaction.currency !== currency ||
        !transaction.date.startsWith(month) ||
        transaction.type === "transfer"
      ) {
        return result;
      }
      return transaction.type === "income"
        ? { ...result, income: result.income.plus(transaction.amount) }
        : { ...result, expense: result.expense.plus(transaction.amount) };
    },
    { expense: decimal(0), income: decimal(0) },
  );
  const saved = totals.income.minus(totals.expense);
  const savingsRate = totals.income.isZero()
    ? null
    : saved.dividedBy(totals.income).times(100).toDecimalPlaces(1).toFixed();
  return {
    expense: totals.expense.toFixed(),
    income: totals.income.toFixed(),
    saved: saved.toFixed(),
    savingsRate,
  };
}

export function calculateSpendingTrend(
  transactions: readonly DashboardTransaction[],
  currency: Currency,
  months: readonly { key: string; label: string }[],
) {
  return months.map((month) => ({
    ...month,
    amount: transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.currency === currency &&
          transaction.date.startsWith(month.key),
      )
      .reduce((sum, transaction) => sum.plus(transaction.amount), decimal(0))
      .toFixed(),
  }));
}

export function calculateWeeklySpendingTrend(
  transactions: readonly DashboardTransaction[],
  currency: Currency,
  weeks: readonly { end: string; key: string; label: string; start: string }[],
) {
  return weeks.map((week) => ({
    key: week.key,
    label: week.label,
    amount: transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.currency === currency &&
          transaction.date >= week.start &&
          transaction.date <= week.end,
      )
      .reduce((sum, transaction) => sum.plus(transaction.amount), decimal(0))
      .toFixed(),
  }));
}
