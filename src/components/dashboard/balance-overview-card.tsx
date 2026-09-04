"use client";

import { useState } from "react";
import { Landmark, TrendingUp } from "lucide-react";
import type { Currency } from "@/domain/accounts/types";
import { formatMoney } from "@/lib/money/format";

type BalanceTotal = { amount: string; currency: Currency };

export function BalanceOverviewCard({
  accountCount,
  available,
  currency,
  netWorth,
}: {
  accountCount: number;
  available: BalanceTotal[];
  currency: Currency;
  netWorth: BalanceTotal[];
}) {
  const [view, setView] = useState<"available" | "netWorth">("netWorth");
  const totals = view === "netWorth" ? netWorth : available;
  const amount =
    totals.find((item) => item.currency === currency)?.amount ?? "0";
  const Icon = view === "netWorth" ? TrendingUp : Landmark;

  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-neutral-950 p-7 text-white shadow-[0_24px_60px_-32px_rgba(0,0,0,0.7)] sm:p-9">
      <div className="absolute -top-24 -right-20 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            aria-label="Balance view"
            role="group"
            style={{
              alignItems: "center",
              background: "rgb(255 255 255 / 0.08)",
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
                background: "#6ee7b7",
                borderRadius: "9999px",
                bottom: "4px",
                boxShadow:
                  "0 1px 4px rgb(0 0 0 / 0.18), 0 0 18px rgb(52 211 153 / 0.2)",
                left: "4px",
                pointerEvents: "none",
                position: "absolute",
                top: "4px",
                transform:
                  view === "available"
                    ? "translateX(calc(100% + 4px))"
                    : "translateX(0)",
                transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                width: "calc((100% - 12px) / 2)",
                zIndex: 0,
              }}
            />
            <ViewButton
              active={view === "netWorth"}
              label="Net worth"
              onClick={() => setView("netWorth")}
            />
            <ViewButton
              active={view === "available"}
              label="Available"
              onClick={() => setView("available")}
            />
          </div>
          <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
            <Icon aria-hidden="true" className="size-4 text-emerald-300" />
          </span>
        </div>
        <div className="animate-dashboard-swap" key={view}>
          <p className="mt-5 text-sm text-white/50">{currency}</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            {formatMoney(amount, currency)}
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
            {view === "netWorth"
              ? `Across ${accountCount} active ${currency} accounts.`
              : "Ready to use"}
          </p>
        </div>
        {totals.some((item) => item.currency !== currency) && (
          <div className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {totals
              .filter((item) => item.currency !== currency)
              .map((item) => (
                <span
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70"
                  key={item.currency}
                >
                  Plus {formatMoney(item.amount, item.currency)}
                </span>
              ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ViewButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      style={{
        borderRadius: "9999px",
        color: active ? "#064e3b" : "rgb(255 255 255 / 0.55)",
        fontSize: "0.875rem",
        fontWeight: 500,
        lineHeight: "1.25rem",
        minWidth: "6rem",
        padding: "0.375rem 0.75rem",
        position: "relative",
        transition: "color 260ms ease",
        zIndex: 1,
      }}
      type="button"
    >
      {label}
    </button>
  );
}
