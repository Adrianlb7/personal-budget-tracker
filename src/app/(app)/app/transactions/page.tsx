import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Repeat2,
  Trash2,
} from "lucide-react";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { deleteTransaction } from "@/domain/transactions/actions";
import { calculateTransactionTotals } from "@/domain/transactions/calculations";
import type { TransactionDetail } from "@/domain/transactions/types";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";

export default async function TransactionsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_details")
    .select(
      "id,user_id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error("Transactions could not be loaded.");
  const transactions = (data ?? []) as TransactionDetail[];
  const currencies = [...new Set(transactions.map((item) => item.currency))];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Financial activity
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="mt-2 text-neutral-600">
            Income and expenses remain in their original account currency.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionLink
            href="/app/transactions/new?type=income"
            label="Add income"
          />
          <ActionLink
            href="/app/transactions/new?type=expense"
            label="Add expense"
            primary
          />
          <ActionLink
            href="/app/transactions/new?type=transfer"
            label="Transfer"
          />
        </div>
      </div>

      {currencies.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {currencies.map((currency) => {
            const entries = transactions.filter(
              (item) => item.currency === currency,
            );
            const totals = calculateTransactionTotals(entries);
            return (
              <div className="rounded-2xl border bg-white p-5" key={currency}>
                <p className="text-sm text-neutral-500">{currency} totals</p>
                <p className="mt-2 text-sm text-emerald-700">
                  Income {formatMoney(totals.income, currency)}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Expenses {formatMoney(totals.expense, currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {transactions.length ? (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-white">
          {transactions.map((transaction) => {
            const income = transaction.type === "income";
            const transfer = transaction.type === "transfer";
            const installment =
              transaction.metadata.recurring_kind === "installment";
            const subscription =
              transaction.metadata.recurring_kind === "subscription";
            const Icon = installment
              ? Repeat2
              : subscription
                ? RefreshCw
                : transfer
                  ? ArrowRightLeft
                  : income
                    ? ArrowDownLeft
                    : ArrowUpRight;
            const iconTone = installment
              ? "bg-violet-50 text-violet-700"
              : subscription
                ? "bg-amber-50 text-amber-700"
                : transfer
                  ? "bg-blue-50 text-blue-700"
                  : income
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700";
            return (
              <article
                className="flex items-center gap-4 border-b p-5 last:border-b-0"
                key={transaction.id}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium">
                    {transaction.description}
                  </h2>
                  <p className="truncate text-sm text-neutral-500">
                    {transaction.metadata.recurring_kind === "installment"
                      ? `Installment · ${transaction.account_name} → ${transaction.destination_account_name}`
                      : transaction.metadata.recurring_kind === "subscription"
                        ? `Subscription · ${transaction.account_name}`
                        : transfer
                          ? `${transaction.account_name} → ${transaction.destination_account_name}`
                          : `${transaction.category_name} · ${transaction.account_name}`}{" "}
                    · {formatDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={`font-semibold ${income ? "text-emerald-700" : transfer ? "text-blue-700" : "text-neutral-900"}`}
                >
                  {transfer ? "" : income ? "+" : "−"}
                  {formatMoney(transaction.amount, transaction.currency)}
                  {transfer &&
                    transaction.destination_currency &&
                    transaction.destination_currency !== transaction.currency &&
                    transaction.destination_amount && (
                      <span className="ml-2 text-sm font-normal text-neutral-500">
                        →{" "}
                        {formatMoney(
                          transaction.destination_amount,
                          transaction.destination_currency,
                        )}
                      </span>
                    )}
                </p>
                <ConfirmActionButton
                  action={deleteTransaction.bind(null, transaction.id)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-700"
                  confirmation={`Permanently delete ${transaction.description}?`}
                >
                  <Trash2 aria-label="Delete transaction" className="size-4" />
                </ConfirmActionButton>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No transactions yet</h2>
          <p className="mt-2 text-neutral-500">
            Add income or an expense to start building account history.
          </p>
        </div>
      )}
    </section>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${primary ? "bg-emerald-900 text-white" : "border bg-white text-neutral-700"}`}
      href={href}
    >
      <Plus aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
