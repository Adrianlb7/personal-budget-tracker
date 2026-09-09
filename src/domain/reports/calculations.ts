import type { Currency } from "@/domain/accounts/types";
import type { TransactionType } from "@/domain/transactions/types";
import { decimal } from "@/lib/money/decimal";

export const reportRanges = ["1M", "3M", "6M", "YTD", "1Y", "ALL"] as const;
export type ReportRange = (typeof reportRanges)[number];

export type ReportTransaction = {
  amount: string;
  category_name: string | null;
  currency: Currency;
  date: string;
  type: TransactionType;
};

export type Report = {
  categories: { amount: string; name: string }[];
  expense: string;
  income: string;
  netCashFlow: string;
  savingsRate: string | null;
  timeline: {
    expense: string;
    income: string;
    key: string;
    label: string;
    netCashFlow: string;
    netWorth: string;
  }[];
};

export function calculateReport(
  transactions: readonly ReportTransaction[],
  range: ReportRange,
  currentNetWorth: string,
  today: Date,
  currency: Currency = "USD",
): Report {
  const todayKey = isoDate(today);
  const eligible = transactions.filter(
    (item) =>
      item.currency === currency &&
      item.type !== "transfer" &&
      item.date <= todayKey,
  );
  const start = reportStart(range, today, eligible);
  const startKey = isoDate(start);
  const filtered = eligible.filter((item) => item.date >= startKey);
  const income = sumType(filtered, "income");
  const expense = sumType(filtered, "expense");
  const netCashFlow = income.minus(expense);
  const savingsRate = income.isZero()
    ? null
    : netCashFlow.dividedBy(income).times(100).toDecimalPlaces(1).toFixed();
  const categories = new Map<string, ReturnType<typeof decimal>>();

  for (const item of filtered) {
    if (item.type !== "expense") continue;
    const name = item.category_name?.trim() || "Uncategorized";
    categories.set(
      name,
      (categories.get(name) ?? decimal(0)).plus(item.amount),
    );
  }

  const buckets =
    range === "1M" ? dailyBuckets(start, today) : monthlyBuckets(start, today);
  const timeline = buckets.map((bucket) => {
    const items = eligible.filter(
      (item) => item.date >= bucket.start && item.date <= bucket.end,
    );
    const bucketIncome = sumType(items, "income");
    const bucketExpense = sumType(items, "expense");
    const flowsAfterBucket = eligible
      .filter((item) => item.date > bucket.end)
      .reduce(
        (sum, item) =>
          item.type === "income"
            ? sum.plus(item.amount)
            : sum.minus(item.amount),
        decimal(0),
      );
    return {
      expense: bucketExpense.toFixed(),
      income: bucketIncome.toFixed(),
      key: bucket.key,
      label: bucket.label,
      netCashFlow: bucketIncome.minus(bucketExpense).toFixed(),
      netWorth: decimal(currentNetWorth).minus(flowsAfterBucket).toFixed(),
    };
  });

  return {
    categories: [...categories.entries()]
      .map(([name, amount]) => ({ amount: amount.toFixed(), name }))
      .sort((left, right) => decimal(right.amount).comparedTo(left.amount)),
    expense: expense.toFixed(),
    income: income.toFixed(),
    netCashFlow: netCashFlow.toFixed(),
    savingsRate,
    timeline,
  };
}

function sumType(
  items: readonly ReportTransaction[],
  type: "expense" | "income",
) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum.plus(item.amount), decimal(0));
}

function reportStart(
  range: ReportRange,
  today: Date,
  transactions: readonly ReportTransaction[],
) {
  if (range === "ALL") {
    const earliest = transactions.map((item) => item.date).sort()[0];
    return earliest ? new Date(`${earliest}T00:00:00Z`) : startOfMonth(today);
  }
  if (range === "YTD") return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  const months =
    range === "1M" ? 1 : range === "3M" ? 3 : range === "6M" ? 6 : 12;
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() - months,
      today.getUTCDate(),
    ),
  );
}

function dailyBuckets(start: Date, today: Date) {
  const buckets = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = isoDate(cursor);
    buckets.push({
      end: key,
      key,
      label: new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(cursor),
      start: key,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}

function monthlyBuckets(start: Date, today: Date) {
  const buckets = [];
  const cursor = startOfMonth(start);
  while (cursor <= today) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const end = new Date(Date.UTC(year, month + 1, 0));
    buckets.push({
      end: isoDate(end > today ? today : end),
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
        year:
          cursor.getUTCFullYear() === today.getUTCFullYear()
            ? undefined
            : "2-digit",
      }).format(cursor),
      start: isoDate(cursor < start ? start : cursor),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return buckets;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
