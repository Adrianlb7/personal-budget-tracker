"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  WalletCards,
  Download,
} from "lucide-react";
import type { Report, ReportRange } from "@/domain/reports/calculations";
import { reportRanges } from "@/domain/reports/calculations";
import { formatMoney } from "@/lib/money/format";

const categoryColors = [
  "#047857",
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#d1fae5",
];

export function ReportsDashboard({
  reports,
}: {
  reports: Record<ReportRange, Report>;
}) {
  const [range, setRange] = useState<ReportRange>("6M");
  const report = reports[range];
  const timeline = report.timeline.map((item) => ({
    ...item,
    expenseNumber: Number(item.expense),
    incomeNumber: Number(item.income),
    netCashFlowNumber: Number(item.netCashFlow),
    netWorthNumber: Number(item.netWorth),
  }));
  const categories = report.categories.map((item) => ({
    ...item,
    value: Number(item.amount),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Financial clarity
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-[-0.04em]">
            Reports
          </h1>
          <p className="mt-2 text-neutral-500">
            Understand the movement behind your money.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-neutral-50"
            download
            href="/api/export"
          >
            <Download aria-hidden="true" className="size-4" /> Export data
          </a>
          <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/[0.06]">
            {reportRanges.map((option) => (
              <button
                className="rounded-full px-3 py-2 text-xs font-medium transition"
                key={option}
                onClick={() => setRange(option)}
                style={{
                  background: range === option ? "#171717" : "transparent",
                  color: range === option ? "#fff" : "#737373",
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ArrowDownLeft}
          label="Income"
          tone="green"
          value={formatMoney(report.income, "USD")}
        />
        <SummaryCard
          icon={ArrowUpRight}
          label="Expenses"
          tone="red"
          value={formatMoney(report.expense, "USD")}
        />
        <SummaryCard
          icon={WalletCards}
          label="Net cash flow"
          tone={report.netCashFlow.startsWith("-") ? "red" : "green"}
          value={formatMoney(report.netCashFlow, "USD")}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Savings rate"
          tone="blue"
          value={
            report.savingsRate === null
              ? "Not applicable"
              : `${report.savingsRate}%`
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <ReportCard
          subtitle="Estimated from current balances and recorded cash flow"
          title="Net worth over time"
        >
          <ResponsiveContainer height={280} width="100%">
            <AreaChart data={timeline} margin={{ left: 4, right: 8, top: 12 }}>
              <defs>
                <linearGradient id="netWorthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={11}
                tickFormatter={compactUsd}
                tickLine={false}
                width={54}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Area
                dataKey="netWorthNumber"
                fill="url(#netWorthFill)"
                name="Net worth"
                stroke="#047857"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard
          subtitle="Transfers are excluded"
          title="Income vs expenses"
        >
          <ResponsiveContainer height={280} width="100%">
            <BarChart data={timeline} margin={{ left: 0, right: 4, top: 12 }}>
              <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={11}
                tickFormatter={compactUsd}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Bar
                dataKey="incomeNumber"
                fill="#10b981"
                name="Income"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expenseNumber"
                fill="#f87171"
                name="Expenses"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <ReportCard subtitle="USD expenses only" title="Spending by category">
          {categories.length ? (
            <ResponsiveContainer height={280} width="100%">
              <BarChart
                data={categories.slice(0, 8)}
                layout="vertical"
                margin={{ left: 16, right: 12, top: 8 }}
              >
                <XAxis
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={compactUsd}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  type="category"
                  width={88}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="value" name="Spent" radius={[0, 8, 8, 0]}>
                  {categories.slice(0, 8).map((item, index) => (
                    <Cell
                      fill={categoryColors[index % categoryColors.length]}
                      key={item.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyReport />
          )}
        </ReportCard>

        <ReportCard
          subtitle="Income minus expenses for each period"
          title="Cash-flow rhythm"
        >
          <ResponsiveContainer height={280} width="100%">
            <BarChart data={timeline} margin={{ left: 4, right: 8, top: 12 }}>
              <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={11}
                tickFormatter={compactUsd}
                tickLine={false}
                width={54}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Bar
                dataKey="netCashFlowNumber"
                name="Net cash flow"
                radius={[7, 7, 7, 7]}
              >
                {timeline.map((item) => (
                  <Cell
                    fill={item.netCashFlowNumber < 0 ? "#ef4444" : "#059669"}
                    key={item.key}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>

      <p className="mt-5 text-xs leading-5 text-neutral-500">
        Net worth includes USD accounts and BTC valued at the latest daily USD
        rate. CLP is excluded. Historical values are estimates until monthly
        snapshots accumulate.
      </p>
    </div>
  );
}

function ReportCard({
  children,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_48px_-38px_rgba(0,0,0,.4)] sm:p-7">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof ArrowDownLeft;
  label: string;
  tone: "blue" | "green" | "red";
  value: string;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <section className="rounded-[1.6rem] border border-black/[0.06] bg-white p-5 shadow-sm">
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-5 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </section>
  );
}

function MoneyTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-neutral-950 px-3 py-2 text-xs text-white shadow-xl">
      {label && <p className="mb-1 text-white/55">{label}</p>}
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {formatMoney(String(item.value), "USD")}
        </p>
      ))}
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-neutral-400">
      No expenses in this period.
    </div>
  );
}

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value);
}
