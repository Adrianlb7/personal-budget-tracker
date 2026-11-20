import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Pencil,
} from "lucide-react";
import { RecurringIcon } from "@/components/recurring/recurring-icon";
import type { TransactionDetail } from "@/domain/transactions/types";
import type { RecurringCommitment } from "@/domain/recurring/types";
import { recurringPaymentSchedule } from "@/domain/recurring/payment-schedule";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";
import styles from "./payment-detail.module.css";

export default async function RecurringPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const [commitmentResult, paymentsResult] = await Promise.all([
    supabase
      .from("recurring_commitments")
      .select(
        "id,user_id,kind,name,account_id,destination_account_id,payment_method,amount,currency,frequency,starts_on,next_due_on,ends_on,installment_count,installments_completed,status,created_at,updated_at,icon_emoji,icon_image_path",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("transaction_details")
      .select(
        "id,user_id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
      )
      .eq("user_id", user.id)
      .in("type", ["expense", "transfer"])
      .contains("metadata", { recurring_commitment_id: id })
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (commitmentResult.error || paymentsResult.error)
    throw new Error("Payment history could not be loaded.");
  if (!commitmentResult.data) notFound();

  const commitment = commitmentResult.data as RecurringCommitment;
  const payments = (paymentsResult.data ?? []) as TransactionDetail[];
  const schedule = recurringPaymentSchedule(commitment, payments);
  const installment = commitment.kind === "external_installment";
  const hasPaymentCountMismatch =
    installment && payments.length > schedule.completed;

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <Link className={styles.backLink} href="/app/recurring">
          <ArrowLeft size={16} aria-hidden="true" />
          Recurring
        </Link>
        <Link className={styles.editLink} href={`/app/recurring/${id}/edit`}>
          <Pencil size={16} aria-hidden="true" />
          Edit plan
        </Link>
      </div>

      <article className={styles.receipt}>
        <header className={styles.receiptHeader}>
          <div className={styles.metaRow}>
            <span className={styles.kind}>
              <RecurringIcon item={commitment} variant="badge" />
              {installment ? "Installment" : "Subscription"}
            </span>
            <span className={styles.status}>{commitment.status}</span>
          </div>
          <h1 className={styles.title}>{commitment.name}</h1>
          <p className={styles.cadence}>
            {formatMoney(commitment.amount, commitment.currency)} ·{" "}
            {frequencyLabel(commitment.frequency)} payment
          </p>
        </header>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <p className={styles.summaryLabel}>Paid in Orba</p>
            <p className={styles.summaryValue}>
              {formatMoney(schedule.recordedPaid, commitment.currency)}
            </p>
          </div>
          <div className={styles.summaryItem}>
            <p className={styles.summaryLabel}>
              {installment
                ? "Remaining planned"
                : schedule.upcoming.length > 0
                  ? "Next payment"
                  : "Scheduled amount"}
            </p>
            <p className={styles.summaryValue}>
              {formatMoney(
                schedule.remainingEstimate ?? commitment.amount,
                commitment.currency,
              )}
            </p>
          </div>
        </div>
        {installment && schedule.total > 0 && (
          <div className={styles.progressBlock}>
            <div className={styles.progressLabels}>
              <span>
                {schedule.completed} of {schedule.total} installments complete
              </span>
              <span>{schedule.remaining} remaining</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (schedule.completed / schedule.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className={styles.perforation} aria-hidden="true" />

        <section className={styles.schedule}>
          <div className={styles.scheduleHeading}>
            <div>
              <p className={styles.eyebrow}>Timeline</p>
              <h2 className={styles.scheduleTitle}>Payment schedule</h2>
            </div>
            <span className={styles.count}>
              <CalendarDays size={15} aria-hidden="true" />
              {installment
                ? `${schedule.total} payments`
                : `${frequencyLabel(commitment.frequency)} schedule`}
            </span>
          </div>
          <p className={styles.scheduleNote}>
            Recorded payments show actual dates and amounts. Upcoming payments
            are estimates.
          </p>

          {hasPaymentCountMismatch && (
            <p className={styles.warning}>
              This plan&apos;s completion count differs from its linked
              transaction history. Review the plan and payments if you recently
              edited or removed a transaction.
            </p>
          )}

          {schedule.earlierCompleted === 0 &&
          schedule.recorded.length === 0 &&
          schedule.upcoming.length === 0 ? (
            <div className={styles.empty}>
              No payments are scheduled or recorded for this commitment.
            </div>
          ) : (
            <ol className={styles.timeline}>
              {schedule.earlierCompleted > 0 && (
                <li className={styles.timelineRow}>
                  <TimelineMarker complete />
                  <div className={styles.timelineText}>
                    <p className={styles.rowTitle}>
                      {schedule.earlierCompleted}{" "}
                      {schedule.earlierCompleted === 1
                        ? "completed payment"
                        : "completed payments"}{" "}
                      without a linked transaction
                    </p>
                    <p className={styles.rowDetail}>
                      Dates and amounts are not available in Orba.
                    </p>
                  </div>
                </li>
              )}
              {schedule.recorded.map((payment) => (
                <li className={styles.timelineRow} key={payment.id}>
                  <TimelineMarker complete />
                  <div className={styles.timelineText}>
                    <p className={styles.rowTitle}>
                      {formatDate(payment.date)}
                    </p>
                    <p className={styles.rowDetail}>
                      Paid · {paymentDescription(payment)}
                    </p>
                  </div>
                  <p className={styles.amount}>
                    {formatMoney(payment.amount, payment.currency)}
                  </p>
                </li>
              ))}
              {schedule.upcoming.map((date, index) => (
                <li className={styles.timelineRow} key={`${date}-${index}`}>
                  <TimelineMarker />
                  <div className={styles.timelineText}>
                    <p className={styles.rowTitle}>{formatDate(date)}</p>
                    <p className={styles.rowDetail}>
                      {commitment.status === "paused" ? "Paused · " : "Due · "}
                      {installment
                        ? `${schedule.completed + index + 1} of ${schedule.total}`
                        : index === 0
                          ? "Next payment"
                          : "Expected payment"}
                    </p>
                  </div>
                  <p className={`${styles.amount} ${styles.estimate}`}>
                    {formatMoney(commitment.amount, commitment.currency)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {commitment.kind === "subscription" &&
            commitment.status === "active" &&
            schedule.upcoming.length === 4 && (
              <p className={styles.subscriptionNote}>
                Showing the next four expected dates. This subscription
                continues until you cancel it or its end date arrives.
              </p>
            )}
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerStatus}>
            <Clock3 size={16} aria-hidden="true" />
            <span>
              {commitment.status === "completed"
                ? "All scheduled payments are complete."
                : commitment.status === "cancelled"
                  ? "This commitment has been cancelled."
                  : commitment.status === "paused"
                    ? `Paused · next scheduled ${formatDate(commitment.next_due_on)}`
                    : `Next due ${formatDate(commitment.next_due_on)}`}
            </span>
          </div>
          <Link className={styles.footerLink} href="/app/recurring">
            Back to recurring
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </footer>
      </article>
    </section>
  );
}

function TimelineMarker({ complete = false }: { complete?: boolean }) {
  return (
    <span className={`${styles.marker} ${complete ? styles.complete : ""}`}>
      {complete ? (
        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <span className={styles.markerDot} />
      )}
    </span>
  );
}

function paymentDescription(payment: TransactionDetail) {
  if (payment.metadata.payment_method === "savings_reimbursement") {
    return `${payment.account_name} → ${payment.destination_account_name ?? "Savings"}`;
  }
  return `From ${payment.account_name}`;
}

function frequencyLabel(frequency: RecurringCommitment["frequency"]) {
  if (frequency === "weekly") return "weekly";
  if (frequency === "yearly") return "yearly";
  return "monthly";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
