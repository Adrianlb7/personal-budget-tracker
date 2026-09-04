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
          <p className="font-semibold">Spending chart</p>
          <p className="mt-1 text-sm text-neutral-500">
            Last six {period} · {currency}
          </p>
        </div>
        <div
          aria-label="Spending chart period"
          role="group"
          style={{
            alignItems: "center",
            background: "#f5f5f5",
            borderRadius: "9999px",
            display: "inline-flex",
            gap: "4px",
            padding: "4px",
            position: "relative",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              background: "#ffffff",
              borderRadius: "9999px",
              bottom: "4px",
              boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)",
              left: "4px",
              pointerEvents: "none",
              position: "absolute",
              top: "4px",
              transform:
                period === "weeks"
                  ? "translateX(calc(100% + 4px))"
                  : "translateX(0)",
              transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              width: "calc((100% - 12px) / 2)",
              zIndex: 0,
            }}
          />
          {(["months", "weeks"] as const).map((option) => (
            <button
              aria-pressed={period === option}
              key={option}
              onClick={() => setPeriod(option)}
              style={{
                borderRadius: "9999px",
                color: period === option ? "#171717" : "#a3a3a3",
                fontSize: "0.75rem",
                fontWeight: 500,
                lineHeight: "1rem",
                minWidth: "4rem",
                padding: "0.375rem 0.75rem",
                position: "relative",
                transition: "color 260ms ease",
                zIndex: 1,
              }}
              type="button"
            >
              {option === "months" ? "Months" : "Weeks"}
            </button>
          ))}
        </div>
      </div>
      <div
        className="animate-dashboard-swap mt-8 grid h-48 grid-cols-6 items-end gap-3 sm:gap-5"
        key={period}
      >
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
