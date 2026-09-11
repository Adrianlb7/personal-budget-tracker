import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Landmark,
  Plus,
  PiggyBank,
  Sparkles,
  Bitcoin,
} from "lucide-react";
import { BalanceOverviewCard } from "@/components/dashboard/balance-overview-card";
import { LiquidDashboardBackground } from "@/components/dashboard/liquid-dashboard-background";
import { DashboardHoverRegion } from "@/components/dashboard/dashboard-hover-region";
import {
  DashboardPrivacyToggle,
  MoneyValue,
} from "@/components/dashboard/dashboard-privacy";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import type { Account, Currency } from "@/domain/accounts/types";
import {
  calculateBudgetProgress,
  calculateBudgetTotals,
} from "@/domain/budgets/calculations";
import type { MonthlyBudget } from "@/domain/budgets/types";
import {
  addConvertedValueToNetWorth,
  calculateAvailableByCurrency,
  calculateMonthlyMetrics,
  calculateNetWorthByCurrency,
  calculateSpendingTrend,
  calculateWeeklySpendingTrend,
} from "@/domain/dashboard/calculations";
import type { RecurringCommitment } from "@/domain/recurring/types";
import type { TransactionDetail } from "@/domain/transactions/types";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";
import { decimal } from "@/lib/money/decimal";
import { getBtcUsdPrice } from "@/lib/market-data/bitcoin";
import { calculateBtcUsdValue } from "@/domain/fx/calculations";
import { dailyMoneyMessage } from "@/domain/dashboard/daily-message";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const months = recentMonths(6);
  const weeks = recentWeeks(6);
  const [
    accountsResult,
    transactionsResult,
    recurringResult,
    budgetsResult,
    btcPrice,
  ] = await Promise.all([
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
      .from("recurring_commitments")
      .select(
        "id,user_id,kind,name,account_id,destination_account_id,payment_method,amount,currency,frequency,starts_on,next_due_on,ends_on,installment_count,installments_completed,status,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("next_due_on")
      .limit(3),
    supabase
      .from("monthly_budgets")
      .select(
        "id,user_id,category_id,amount,currency,month,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .eq("month", `${months.at(-1)!.key}-01`),
    getBtcUsdPrice(),
  ]);

  if (
    accountsResult.error ||
    transactionsResult.error ||
    recurringResult.error ||
    budgetsResult.error
  )
    throw new Error("Your dashboard could not be loaded.");
  const accounts = (accountsResult.data ?? []) as Account[];
  const transactions = (transactionsResult.data ?? []) as TransactionDetail[];
  const upcoming = (recurringResult.data ?? []) as RecurringCommitment[];
  const budgets = (budgetsResult.data ?? []).map((budget) => ({
    ...budget,
    category_name: "",
  })) as MonthlyBudget[];
  const preferredCurrency: Currency = "USD";
  const usdAccounts = accounts.filter((account) => account.currency === "USD");
  const available = calculateAvailableByCurrency(usdAccounts);
  const metrics = calculateMonthlyMetrics(
    transactions,
    preferredCurrency,
    months.at(-1)!.key,
  );
  const budgetTotals = calculateBudgetTotals(
    calculateBudgetProgress(budgets, transactions),
    preferredCurrency,
  );
  const budgetUsage = decimal(budgetTotals.budgeted).isZero()
    ? null
    : decimal(budgetTotals.spent)
        .dividedBy(budgetTotals.budgeted)
        .times(100)
        .toDecimalPlaces(0)
        .toNumber();
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
  const btcAmount = accounts
    .filter((account) => account.currency === "BTC")
    .reduce(
      (total, account) =>
        total.plus(account.current_balance ?? account.opening_balance),
      decimal(0),
    );
  const btcUsdValue = btcPrice
    ? calculateBtcUsdValue(btcAmount.toFixed(), btcPrice)
    : null;
  const netWorth = addConvertedValueToNetWorth(
    calculateNetWorthByCurrency(usdAccounts),
    btcUsdValue,
    "USD",
  );
  const dailyMessage = dailyMoneyMessage(new Date());

  return (
    <>
      <LiquidDashboardBackground />
      <DashboardHoverRegion>
        <header className="flex items-start justify-between gap-3 sm:items-end">
          <div>
            <h1 className="text-[2rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-4xl">
              Good {dayPeriod()}, <span className="font-extrabold">Adri</span>
            </h1>
            <p className="mt-2 hidden text-neutral-500 sm:block">
              Here’s where your money stands today.
            </p>
            <p className="mt-2 text-sm text-neutral-500 sm:hidden">
              {dailyMessage}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardPrivacyToggle />
            <div
              aria-label="Adri profile"
              className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-lg font-medium text-white shadow-sm sm:hidden"
            >
              A
              <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-white bg-emerald-600" />
            </div>
            <Link
              className="hidden items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 sm:inline-flex"
              data-dashboard-hover
              href="/app/transactions/new?type=expense"
            >
              <Sparkles aria-hidden="true" className="size-4" /> Add transaction
            </Link>
          </div>
        </header>

        <div className="mt-7 grid gap-5 sm:mt-8 lg:grid-cols-[1.5fr_1fr]">
          <BalanceOverviewCard
            available={available}
            currency={preferredCurrency}
            dailyMessage={dailyMessage}
            netWorth={netWorth}
          />

          <article className="hidden rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_16px_45px_-32px_rgba(0,0,0,0.35)] sm:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Saved this month</p>
                <p
                  className={`mt-2 text-3xl font-semibold tracking-tight ${metrics.saved.startsWith("-") ? "text-red-600" : "text-emerald-800"}`}
                >
                  <MoneyValue>
                    {formatMoney(metrics.saved, preferredCurrency)}
                  </MoneyValue>
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
                <MoneyValue>
                  {metrics.savingsRate === null
                    ? "—"
                    : `${metrics.savingsRate}%`}
                </MoneyValue>
              </span>
            </div>
          </article>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-4">
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
            detail={`${btcAmount.toFixed()} BTC`}
            icon={Bitcoin}
            label="BTC holdings"
            tone="orange"
            value={
              btcUsdValue
                ? formatMoney(btcUsdValue, "USD")
                : "Price unavailable"
            }
          />
        </div>

        <Link
          className="mt-4 block rounded-[1.75rem] border border-black/[0.06] bg-white p-5 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)] sm:hidden"
          href={budgetUsage === null ? "/app/budget" : "/app/reports"}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold">Spending this month</p>
            <ChevronRight
              aria-hidden="true"
              className="size-5 text-neutral-400"
            />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
            <MoneyValue>
              {formatMoney(metrics.expense, preferredCurrency)}
            </MoneyValue>
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-300"
                style={{ width: `${Math.min(budgetUsage ?? 0, 100)}%` }}
              />
            </div>
            <span className="text-sm text-neutral-400">
              {budgetUsage === null ? "—" : `${budgetUsage}%`}
            </span>
          </div>
          <p className="mt-5 rounded-2xl bg-emerald-50/70 px-4 py-4 text-sm leading-6 text-neutral-500">
            {budgetUsage === null
              ? "Set a monthly budget to measure your spending progress."
              : "Open your reports to explore this month’s spending insights."}
          </p>
        </Link>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1.35fr_1fr]">
          <article className="hidden rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)] sm:block sm:p-7">
            <SpendingChart
              currency={preferredCurrency}
              monthly={spendingTrend}
              weekly={weeklySpendingTrend}
            />
          </article>

          <article className="rounded-[1.75rem] border border-black/[0.06] bg-white p-5 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)] sm:rounded-[2rem] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Your accounts</p>
                <p className="mt-1 text-sm text-neutral-500 sm:hidden">
                  {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"}
                </p>
                <p className="mt-1 hidden text-sm text-neutral-500 sm:block">
                  Current balances
                </p>
              </div>
              <Link
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                href="/app/accounts"
              >
                <ArrowRight aria-label="View accounts" className="size-4" />
              </Link>
            </div>
            <div
              aria-label="Account balances"
              className="dashboard-account-scroll mt-5 space-y-1 pr-1"
              style={{
                maxHeight: "12.5rem",
                overflowY: "auto",
                overscrollBehavior: "contain",
                scrollbarWidth: "none",
              }}
            >
              {accounts.map((account) => (
                <div
                  className="flex items-center gap-3 rounded-2xl px-2 py-3"
                  key={account.id}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-2xl ${account.type === "investment" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-800"}`}
                  >
                    {account.type === "investment" ? (
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    ) : (
                      <Landmark aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {account.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {account.currency}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    <MoneyValue>
                      {formatMoney(
                        account.current_balance ?? account.opening_balance,
                        account.currency,
                      )}
                    </MoneyValue>
                  </p>
                </div>
              ))}
              {!accounts.length && (
                <EmptyRow text="Add your first account to see it here." />
              )}
            </div>
          </article>
        </div>

        <Link
          aria-label="Add transaction"
          className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-emerald-950 text-white shadow-[0_14px_32px_-12px_rgba(3,78,59,0.75)] transition active:scale-95 sm:hidden"
          href="/app/transactions/new?type=expense"
        >
          <Plus aria-hidden="true" className="size-7" />
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <article className="rounded-[2rem] border border-black/[0.06] bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Recent activity</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Latest movements
                </p>
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
                    <MoneyValue>
                      {transaction.type === "income"
                        ? "+"
                        : transaction.type === "expense"
                          ? "−"
                          : ""}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </MoneyValue>
                  </p>
                </div>
              ))}
              {!recentTransactions.length && (
                <EmptyRow text="Your recent transactions will appear here." />
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-[#eef7f1] p-7">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-white/70 text-emerald-800">
                <CalendarClock aria-hidden="true" className="size-5" />
              </span>
              <Link
                className="text-sm font-medium text-emerald-800"
                href="/app/recurring"
              >
                View all
              </Link>
            </div>
            <p className="mt-6 font-semibold">Upcoming commitments</p>
            {upcoming.length ? (
              <div className="mt-3 divide-y divide-emerald-950/10">
                {upcoming.map((item) => (
                  <div className="flex items-center gap-3 py-3" key={item.id}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {item.kind === "subscription"
                          ? "Subscription"
                          : item.payment_method === "savings_reimbursement"
                            ? "Savings reimbursement"
                            : "Installment"}{" "}
                        · {shortDate(item.next_due_on)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      <MoneyValue>
                        {formatMoney(item.amount, item.currency)}
                      </MoneyValue>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                Nothing scheduled yet. Add a subscription or installment to see
                it here.
              </p>
            )}
          </article>
        </div>
      </DashboardHoverRegion>
    </>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail?: string;
  icon: typeof ArrowDownLeft;
  label: string;
  tone: "blue" | "green" | "orange" | "red";
  value: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <article className="min-w-0 rounded-[1.35rem] border border-black/[0.06] bg-white p-3 shadow-[0_14px_38px_-32px_rgba(0,0,0,0.3)] sm:rounded-[1.6rem] sm:p-5">
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <p className="mt-3 truncate text-[0.68rem] text-neutral-500 sm:mt-5 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold tracking-tight sm:text-xl">
        <MoneyValue>{value}</MoneyValue>
      </p>
      {detail && (
        <p className="mt-1 truncate text-[0.6rem] text-neutral-400 sm:text-xs">
          <MoneyValue>{detail}</MoneyValue>
        </p>
      )}
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
