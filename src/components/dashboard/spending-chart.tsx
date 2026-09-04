"use client";

import { useState } from "react";
import type { Currency } from "@/domain/accounts/types";
import { decimal } from "@/lib/money/decimal";
import { formatMoney } from "@/lib/money/format";

type ChartPoint = { amount: string; key: string; label: string };

export function SpendingChart({
  currency,
  monthly,
  weekly,
}: {
  currency: Currency;
  monthly: ChartPoint[];
  weekly: ChartPoint[];
}) {
  const [period, setPeriod] = useState<"months" | "weeks">("months");
  const data = period === "months" ? monthly : weekly;
  const maximum = data.reduce(
    (largest, item) => decimalMax(largest, item.amount),
    "0",
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Spending rhythm</p>
          <p className="mt-1 text-sm text-neutral-500">
            Last six {period} · {currency}
          </p>
        </div>
        <div
          aria-label="Spending chart period"
          className="flex items-center gap-1 rounded-full bg-neutral-100 p-1"
          role="group"
        >
          {(["months", "weeks"] as const).map((option) => (
            <button
              aria-pressed={period === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                period === option
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
              key={option}
              onClick={() => setPeriod(option)}
              type="button"
            >
              {option === "months" ? "Months" : "Weeks"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid h-48 grid-cols-6 items-end gap-3 sm:gap-5">
        {data.map((item, index) => {
          const height = decimal(maximum).isZero()
            ? 4
            : Math.max(
                4,
                decimal(item.amount).dividedBy(maximum).times(100).toNumber(),
              );
          const current = index === data.length - 1;
          return (
            <div
              className="flex h-full flex-col justify-end gap-3"
              key={item.key}
            >
              <div className="group relative flex flex-1 items-end justify-center">
                <span className="pointer-events-none absolute -top-7 hidden rounded-lg bg-neutral-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                  {formatMoney(item.amount, currency)}
                </span>
                <div
                  aria-label={`${item.label}: ${formatMoney(item.amount, currency)}`}
                  className={`w-full max-w-10 rounded-t-lg transition-all duration-300 ${
                    current
                      ? "bg-emerald-800"
                      : "bg-emerald-100 group-hover:bg-emerald-200"
                  }`}
                  role="img"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={`text-center text-xs ${
                  current
                    ? "font-semibold text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function decimalMax(left: string, right: string) {
  return decimal(left).greaterThan(right) ? left : right;
}
