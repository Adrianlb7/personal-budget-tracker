import Link from "next/link";
import {
  CalendarClock,
  CirclePause,
  CirclePlay,
  CreditCard,
  Plus,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { PayButton } from "@/components/recurring/pay-button";
import { setRecurringStatus } from "@/domain/recurring/actions";
import {
  installmentProgress,
  monthlyCommitmentTotal,
} from "@/domain/recurring/calculations";
import type {
  RecurringCommitment,
  RecurringStatus,
} from "@/domain/recurring/types";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: value } = await searchParams;
  const status: RecurringStatus =
    value === "paused" || value === "cancelled" || value === "completed"
      ? value
      : "active";
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_commitments")
    .select(
      "id,user_id,kind,name,account_id,destination_account_id,payment_method,amount,currency,frequency,starts_on,next_due_on,ends_on,installment_count,installments_completed,status,created_at,updated_at",
    )
    .eq("user_id", user.id)
    .eq("status", status)
    .order("next_due_on");
  if (error) throw new Error("Recurring payments could not be loaded.");
  const items = (data ?? []) as RecurringCommitment[];
  const currencies = [...new Set(items.map((item) => item.currency))];
  return (
    <section className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-emerald-800">Commitments</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Recurring
          </h1>
          <p className="mt-2 text-neutral-500">
            Know what is coming before it reaches your account.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionLink
            href="/app/recurring/new?kind=external_installment"
            label="Installment"
          />
          <ActionLink
            href="/app/recurring/new?kind=subscription"
            label="Subscription"
            primary
          />
        </div>
      </header>
      <nav className="mt-8 flex gap-1 border-b" aria-label="Commitment status">
        {(["active", "paused", "completed", "cancelled"] as const).map(
          (item) => (
            <Link
              className={`border-b-2 px-4 py-3 text-sm capitalize ${status === item ? "border-emerald-800 font-medium text-emerald-800" : "border-transparent text-neutral-400"}`}
              href={
                item === "active"
                  ? "/app/recurring"
                  : `/app/recurring?status=${item}`
              }
              key={item}
            >
              {item}
            </Link>
          ),
        )}
      </nav>
      {status === "active" && currencies.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {currencies.map((currency) => (
            <div
              className="rounded-full border bg-white px-4 py-2 text-sm"
              key={currency}
            >
              <span className="text-neutral-400">Monthly estimate</span>{" "}
              <strong className="ml-2">
                {formatMoney(
                  monthlyCommitmentTotal(
                    items.filter((item) => item.currency === currency),
                  ),
                  currency,
                )}
              </strong>
            </div>
          ))}
        </div>
      )}
      {items.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <CommitmentCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
          <CalendarClock className="mx-auto size-7 text-neutral-300" />
          <h2 className="mt-4 font-semibold">No {status} commitments</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Subscriptions and installments will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function CommitmentCard({ item }: { item: RecurringCommitment }) {
  const progress = installmentProgress(item);
  const Icon = item.kind === "subscription" ? CreditCard : ReceiptText;
  return (
    <article className="rounded-[1.7rem] border border-black/[0.06] bg-white p-6 shadow-[0_16px_45px_-34px_rgba(0,0,0,0.3)]">
      <div className="flex items-start gap-4">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.name}</p>
          <p className="mt-1 text-sm text-neutral-400 capitalize">
            {item.frequency} · due {formatDate(item.next_due_on)}
          </p>
          {item.kind === "external_installment" && (
            <p className="mt-1 text-xs text-neutral-400">
              {item.payment_method === "savings_reimbursement"
                ? "Savings reimbursement"
                : "External payment"}
            </p>
          )}
        </div>
        <p className="font-semibold">
          {formatMoney(item.amount, item.currency)}
        </p>
      </div>
      {progress && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>{progress.completed} completed</span>
            <span>{progress.remaining} remaining</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="mt-5 flex gap-2 border-t pt-4">
        {item.status === "active" &&
          (item.kind === "subscription" ||
            item.payment_method === "external_expense" ||
            item.destination_account_id) && <PayButton id={item.id} />}
        {item.status === "active" &&
          item.kind === "external_installment" &&
          item.payment_method === "savings_reimbursement" &&
          !item.destination_account_id && (
            <span className="px-2 py-1.5 text-sm text-amber-700">
              Savings destination required
            </span>
          )}
        {item.status === "paused" ? (
          <StatusButton
            icon={CirclePlay}
            id={item.id}
            label="Resume"
            status="active"
          />
        ) : item.status === "active" ? (
          <StatusButton
            icon={CirclePause}
            id={item.id}
            label="Pause"
            status="paused"
          />
        ) : null}
        {item.status !== "cancelled" && item.status !== "completed" && (
          <StatusButton
            icon={XCircle}
            id={item.id}
            label="Cancel"
            status="cancelled"
          />
        )}
      </div>
    </article>
  );
}
function StatusButton({
  icon: Icon,
  id,
  label,
  status,
}: {
  icon: typeof CirclePause;
  id: string;
  label: string;
  status: RecurringStatus;
}) {
  return (
    <form action={setRecurringStatus.bind(null, id, status)}>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
        type="submit"
      >
        <Icon className="size-4" />
        {label}
      </button>
    </form>
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
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium ${primary ? "bg-neutral-900 text-white" : "border bg-white"}`}
      href={href}
    >
      <Plus className="size-4" />
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
