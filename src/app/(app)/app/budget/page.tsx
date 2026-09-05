import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleGauge, Trash2 } from "lucide-react";
import { BudgetForm } from "@/components/budgets/budget-form";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import type { Currency } from "@/domain/accounts/types";
import { categoryOptions } from "@/domain/categories/catalog";
import {
  calculateBudgetProgress,
  calculateBudgetTotals,
} from "@/domain/budgets/calculations";
import { deleteMonthlyBudget } from "@/domain/budgets/actions";
import type { MonthlyBudget } from "@/domain/budgets/types";
import type { TransactionDetail } from "@/domain/transactions/types";
import { requireUser } from "@/lib/auth/require-user";
import { decimal } from "@/lib/money/decimal";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requestedMonth } = await searchParams;
  const month = validMonth(requestedMonth) ? requestedMonth : currentMonth();
  const monthStart = `${month}-01`;
  const monthEnd = nextMonth(month);
  const user = await requireUser();
  const supabase = await createClient();
  const [budgetsResult, transactionsResult, categoriesResult, profileResult] =
    await Promise.all([
      supabase
        .from("monthly_budgets")
        .select(
          "id,user_id,category_id,amount,currency,month,created_at,updated_at,categories!inner(name)",
        )
        .eq("user_id", user.id)
        .eq("month", monthStart)
        .order("created_at"),
      supabase
        .from("transaction_details")
        .select(
          "id,user_id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
        )
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lt("date", monthEnd),
      supabase
        .from("categories")
        .select("name")
        .eq("user_id", user.id)
        .eq("kind", "expense")
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("profiles")
        .select("display_currency")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (budgetsResult.error || transactionsResult.error || categoriesResult.error)
    throw new Error("Your monthly budget could not be loaded.");

  const budgets: MonthlyBudget[] = (budgetsResult.data ?? []).map((item) => ({
    ...item,
    category_name: relationName(item.categories),
  }));
  const transactions = (transactionsResult.data ?? []) as TransactionDetail[];
  const progress = calculateBudgetProgress(budgets, transactions);
  const profileCurrency = profileResult.data?.display_currency;
  const preferredCurrency: Currency = profileCurrency === "CLP" ? "CLP" : "USD";
  const currencies = [...new Set(progress.map((item) => item.currency))];

  return (
    <section className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Plan your month
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Budget
          </h1>
          <p className="mt-2 text-neutral-500">
            Give every spending category a clear boundary.
          </p>
        </div>
        <MonthNavigation month={month} />
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {currencies.map((currency) => (
            <BudgetSummary
              currency={currency}
              key={currency}
              progress={progress}
            />
          ))}

          {progress.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {progress.map((item) => (
                <BudgetCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
              <CircleGauge className="mx-auto size-7 text-neutral-300" />
              <h2 className="mt-4 font-semibold">No limits for this month</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Add a category budget to begin tracking your plan.
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)]">
          <p className="font-semibold">Add a category</p>
          <p className="mt-1 text-sm leading-6 text-neutral-500">
            Enter a new category or reuse one from your expenses.
          </p>
          <BudgetForm
            categories={categoryOptions(
              "expense",
              (categoriesResult.data ?? []).map((item) => item.name),
            )}
            currency={preferredCurrency}
            month={month}
          />
        </aside>
      </div>
    </section>
  );
}

function BudgetSummary({
  currency,
  progress,
}: {
  currency: Currency;
  progress: ReturnType<typeof calculateBudgetProgress>;
}) {
  const totals = calculateBudgetTotals(progress, currency);
  const over = decimal(totals.remaining).isNegative();
  return (
    <article className="overflow-hidden rounded-[2rem] bg-neutral-950 p-7 text-white shadow-[0_24px_60px_-34px_rgba(0,0,0,0.7)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-white/55">{currency} monthly plan</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.spent, currency)}
            <span className="ml-2 text-base font-normal text-white/40">
              of {formatMoney(totals.budgeted, currency)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/45">
            {over ? "Over by" : "Remaining"}
          </p>
          <p
            className={
              over
                ? "mt-1 font-semibold text-red-300"
                : "mt-1 font-semibold text-emerald-300"
            }
          >
            {formatMoney(decimal(totals.remaining).abs().toFixed(), currency)}
          </p>
        </div>
      </div>
    </article>
  );
}

function BudgetCard({
  item,
}: {
  item: ReturnType<typeof calculateBudgetProgress>[number];
}) {
  const over = decimal(item.remaining).isNegative();
  const width = Math.min(100, decimal(item.percentUsed).toNumber());
  const progressGradient = over
    ? "linear-gradient(90deg, #b91c1c 0%, #ef4444 58%, #fb7185 100%)"
    : width >= 80
      ? "linear-gradient(90deg, #b45309 0%, #f59e0b 58%, #fcd34d 100%)"
      : "linear-gradient(90deg, #065f46 0%, #10b981 58%, #6ee7b7 100%)";
  const progressGlow = over
    ? "0 2px 12px rgba(239, 68, 68, 0.32)"
    : width >= 80
      ? "0 2px 12px rgba(245, 158, 11, 0.3)"
      : "0 2px 12px rgba(16, 185, 129, 0.3)";
  return (
    <article className="rounded-[1.6rem] border border-black/[0.06] bg-white p-5 shadow-[0_14px_38px_-32px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{item.category_name}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {formatMoney(item.spent, item.currency)} of{" "}
            {formatMoney(item.amount, item.currency)}
          </p>
        </div>
        <ConfirmActionButton
          action={deleteMonthlyBudget.bind(null, item.id)}
          className="rounded-lg p-2 text-neutral-300 hover:bg-red-50 hover:text-red-700"
          confirmation={`Remove the ${item.category_name} budget for this month?`}
        >
          <Trash2
            aria-label={`Delete ${item.category_name} budget`}
            className="size-4"
          />
        </ConfirmActionButton>
      </div>
      <div
        aria-label={`${item.category_name} budget used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={width}
        role="progressbar"
        style={{
          background: "#f5f5f5",
          borderRadius: "9999px",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.08)",
          height: "0.875rem",
          marginTop: "1.25rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: progressGradient,
            borderRadius: "9999px",
            boxShadow: progressGlow,
            height: "100%",
            overflow: "hidden",
            position: "relative",
            transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            width: `${width}%`,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              background: "rgba(255, 255, 255, 0.22)",
              height: "50%",
              left: 0,
              position: "absolute",
              right: 0,
              top: 0,
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span className={over ? "text-red-600" : "text-neutral-400"}>
          {over
            ? `${formatMoney(decimal(item.remaining).abs().toFixed(), item.currency)} over`
            : `${formatMoney(item.remaining, item.currency)} left`}
        </span>
        <span className="font-medium text-neutral-500">
          {item.percentUsed}%
        </span>
      </div>
    </article>
  );
}

function MonthNavigation({ month }: { month: string }) {
  return (
    <nav
      aria-label="Budget month"
      className="flex items-center gap-2 rounded-full border bg-white p-1.5 shadow-sm"
    >
      <Link
        className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
        href={`/app/budget?month=${previousMonth(month)}`}
      >
        <ArrowLeft aria-label="Previous month" className="size-4" />
      </Link>
      <span className="min-w-32 text-center text-sm font-medium">
        {monthLabel(month)}
      </span>
      <Link
        className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
        href={`/app/budget?month=${nextMonth(month).slice(0, 7)}`}
      >
        <ArrowRight aria-label="Next month" className="size-4" />
      </Link>
    </nav>
  );
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function validMonth(value?: string): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}
function monthDate(month: string) {
  return new Date(`${month}-01T00:00:00Z`);
}
function shiftMonth(month: string, amount: number) {
  const date = monthDate(month);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
function previousMonth(month: string) {
  return shiftMonth(month, -1);
}
function nextMonth(month: string) {
  return `${shiftMonth(month, 1)}-01`;
}
function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(monthDate(month));
}
function relationName(value: unknown) {
  if (Array.isArray(value)) return String(value[0]?.name ?? "Category");
  if (value && typeof value === "object" && "name" in value)
    return String(value.name);
  return "Category";
}
