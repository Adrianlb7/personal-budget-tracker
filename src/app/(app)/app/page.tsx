import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  PiggyBank,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import type { Account, Currency } from "@/domain/accounts/types";
import {
  calculateMonthlyMetrics,
  calculateNetWorthByCurrency,
  calculateSpendingTrend,
  calculateWeeklySpendingTrend,
} from "@/domain/dashboard/calculations";
import type { TransactionDetail } from "@/domain/transactions/types";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const months = recentMonths(6);
  const weeks = recentWeeks(6);
  const [accountsResult, transactionsResult, profileResult] = await Promise.all(
    [
      supabase
        .from("account_details")
        .select(
          "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
        )
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at"),
      supabase
        .from("transaction_details")
        .select(
          "id,user_id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
        )
        .eq("user_id", user.id)
        .gte("date", `${months[0].key}-01`)
        .order("date", { ascending: false }),
      supabase
        .from("profiles")
        .select("display_currency")
        .eq("id", user.id)
        .maybeSingle(),
    ],
  );

  if (accountsResult.error || transactionsResult.error)
    throw new Error("Your dashboard could not be loaded.");
  const accounts = (accountsResult.data ?? []) as Account[];
  const transactions = (transactionsResult.data ?? []) as TransactionDetail[];
  const profileCurrency = profileResult.data?.display_currency;
  const preferredCurrency = isCurrency(profileCurrency)
    ? profileCurrency
    : (accounts[0]?.currency ?? "USD");
  const netWorth = calculateNetWorthByCurrency(accounts);
  const preferredNetWorth =
    netWorth.find((item) => item.currency === preferredCurrency)?.amount ?? "0";
  const metrics = calculateMonthlyMetrics(
    transactions,
    preferredCurrency,
    months.at(-1)!.key,
  );
  const spendingTrend = calculateSpendingTrend(
    transactions,
    preferredCurrency,
    months,
  );
  const weeklySpendingTrend = calculateWeeklySpendingTrend(
    transactions,
    preferredCurrency,
    weeks,
  );
  const recentTransactions = transactions.slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-emerald-800">Overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Good {dayPeriod()}
          </h1>
          <p className="mt-2 text-neutral-500">
            Here’s where your money stands today.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700"
          href="/app/transactions/new?type=expense"
        >
          <Sparkles aria-hidden="true" className="size-4" /> Add transaction
        </Link>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="relative overflow-hidden rounded-[2rem] bg-neutral-950 p-7 text-white shadow-[0_24px_60px_-32px_rgba(0,0,0,0.7)] sm:p-9">
          <div className="absolute -top-24 -right-20 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                Net worth · {preferredCurrency}
              </p>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
                <TrendingUp
                  aria-hidden="true"
                  className="size-4 text-emerald-300"
                />
              </span>
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {formatMoney(preferredNetWorth, preferredCurrency)}
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
              Across{" "}
              {
                accounts.filter(
                  (account) => account.currency === preferredCurrency,
                ).length
              }{" "}
              active {preferredCurrency} accounts.
            </p>
            {netWorth.length > 1 && (
              <div className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-5">
                {netWorth
                  .filter((item) => item.currency !== preferredCurrency)
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

        <article className="rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_16px_45px_-32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Saved this month</p>
              <p
                className={`mt-2 text-3xl font-semibold tracking-tight ${metrics.saved.startsWith("-") ? "text-red-600" : "text-emerald-800"}`}
              >
                {formatMoney(metrics.saved, preferredCurrency)}
              </p>
            </div>
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50">
              <PiggyBank
                aria-hidden="true"
                className="size-7 text-emerald-800"
              />
            </div>
          </div>
          <div className="mt-8 flex items-end justify-between border-t pt-5">
            <span className="text-sm text-neutral-500">Savings rate</span>
            <span className="text-lg font-semibold">
              {metrics.savingsRate === null ? "—" : `${metrics.savingsRate}%`}
            </span>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={ArrowDownLeft}
          label="Income this month"
          tone="green"
          value={formatMoney(metrics.income, preferredCurrency)}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Spent this month"
          tone="red"
          value={formatMoney(metrics.expense, preferredCurrency)}
        />
        <MetricCard
          icon={WalletCards}
          label="Active accounts"
          tone="blue"
          value={String(accounts.length)}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)] sm:p-7">
          <SpendingChart
            currency={preferredCurrency}
            monthly={spendingTrend}
            weekly={weeklySpendingTrend}
          />
        </article>

        <article className="rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)] sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Your accounts</p>
              <p className="mt-1 text-sm text-neutral-500">Current balances</p>
            </div>
            <Link
              className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              href="/app/accounts"
            >
              <ArrowRight aria-label="View accounts" className="size-4" />
            </Link>
          </div>
          <div className="mt-5 space-y-1">
            {accounts.slice(0, 5).map((account) => (
              <div
                className="flex items-center gap-3 rounded-2xl px-2 py-3"
                key={account.id}
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-2xl ${account.type === "investment" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-800"}`}
                >
                  {account.type === "investment" ? (
                    <TrendingUp aria-hidden="true" className="size-4" />
                  ) : (
                    <Landmark aria-hidden="true" className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-neutral-400">{account.currency}</p>
                </div>
                <p className="text-sm font-semibold">
                  {formatMoney(
                    account.current_balance ?? account.opening_balance,
                    account.currency,
                  )}
                </p>
              </div>
            ))}
            {!accounts.length && (
              <EmptyRow text="Add your first account to see it here." />
            )}
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-[2rem] border border-black/[0.06] bg-white p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Recent activity</p>
              <p className="mt-1 text-sm text-neutral-500">Latest movements</p>
            </div>
            <Link
              className="text-sm font-medium text-emerald-800"
              href="/app/transactions"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y">
            {recentTransactions.map((transaction) => (
              <div
                className="flex items-center gap-3 py-3.5"
                key={transaction.id}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-100">
                  {transaction.type === "transfer" ? (
                    <ArrowRight aria-hidden="true" className="size-4" />
                  ) : transaction.type === "income" ? (
                    <ArrowDownLeft
                      aria-hidden="true"
                      className="size-4 text-emerald-700"
                    />
                  ) : (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-red-600"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {shortDate(transaction.date)}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {transaction.type === "income"
                    ? "+"
                    : transaction.type === "expense"
                      ? "−"
                      : ""}
                  {formatMoney(transaction.amount, transaction.currency)}
                </p>
              </div>
            ))}
            {!recentTransactions.length && (
              <EmptyRow text="Your recent transactions will appear here." />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-[#eef7f1] p-7">
          <CalendarClock
            aria-hidden="true"
            className="size-6 text-emerald-800"
          />
          <p className="mt-8 font-semibold">Upcoming commitments</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
            Nothing scheduled yet. Recurring payments will appear here once you
            add them.
          </p>
        </article>
      </div>
    </section>
  );
}

function MetricCard({
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
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <article className="rounded-[1.6rem] border border-black/[0.06] bg-white p-5 shadow-[0_14px_38px_-32px_rgba(0,0,0,0.3)]">
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <p className="mt-5 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-neutral-400">{text}</p>;
}

function recentMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1),
    );
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
    };
  });
}

function recentWeeks(count: number) {
  const today = new Date();
  const currentMonday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const day = currentMonday.getUTCDay();
  currentMonday.setUTCDate(
    currentMonday.getUTCDate() - (day === 0 ? 6 : day - 1),
  );

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(currentMonday);
    start.setUTCDate(start.getUTCDate() - (count - index - 1) * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return {
      end: end.toISOString().slice(0, 10),
      key: start.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(start),
      start: start.toISOString().slice(0, 10),
    };
  });
}

function dayPeriod() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}
function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "CLP";
}
