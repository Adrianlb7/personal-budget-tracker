import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Landmark,
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
  const [accountsResult, transactionsResult, recurringResult, btcPrice] =
    await Promise.all([
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
      getBtcUsdPrice(),
    ]);

  if (accountsResult.error || transactionsResult.error || recurringResult.error)
    throw new Error("Your dashboard could not be loaded.");
  const accounts = (accountsResult.data ?? []) as Account[];
  const transactions = (transactionsResult.data ?? []) as TransactionDetail[];
  const upcoming = (recurringResult.data ?? []) as RecurringCommitment[];
  const preferredCurrency: Currency = "USD";
  const usdAccounts = accounts.filter((account) => account.currency === "USD");
  const available = calculateAvailableByCurrency(usdAccounts);
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

  return (
    <>
      <LiquidDashboardBackground />
      <DashboardHoverRegion>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Good {dayPeriod()}, <span className="font-extrabold">Adri</span>
            </h1>
            <p className="mt-2 text-neutral-500">
              Here’s where your money stands today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardPrivacyToggle />
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700"
              data-dashboard-hover
              href="/app/transactions/new?type=expense"
            >
              <Sparkles aria-hidden="true" className="size-4" /> Add transaction
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <BalanceOverviewCard
            available={available}
            currency={preferredCurrency}
            dailyMessage={dailyMoneyMessage(new Date())}
            netWorth={netWorth}
          />

          <article className="rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_16px_45px_-32px_rgba(0,0,0,0.35)]">
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
                <p className="mt-1 text-sm text-neutral-500">
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
    <article className="rounded-[1.6rem] border border-black/[0.06] bg-white p-5 shadow-[0_14px_38px_-32px_rgba(0,0,0,0.3)]">
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <p className="mt-5 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">
        <MoneyValue>{value}</MoneyValue>
      </p>
      {detail && (
        <p className="mt-1 text-xs text-neutral-400">
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
