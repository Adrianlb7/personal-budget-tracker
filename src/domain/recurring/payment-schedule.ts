import { decimal } from "@/lib/money/decimal";
import type { RecurringCommitment, RecurringFrequency } from "./types";

export type RecordedRecurringPayment = {
  amount: string;
  currency: RecurringCommitment["currency"];
  date: string;
  id: string;
};

function dateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function dateString(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function nextRecurringDate(
  value: string,
  frequency: RecurringFrequency,
) {
  const { year, month, day } = dateParts(value);
  if (frequency === "weekly") {
    const next = new Date(Date.UTC(year, month - 1, day + 7));
    return dateString(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
    );
  }

  const targetYear =
    frequency === "yearly" ? year + 1 : year + (month === 12 ? 1 : 0);
  const targetMonth =
    frequency === "yearly" ? month : month === 12 ? 1 : month + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return dateString(targetYear, targetMonth, Math.min(day, lastDay));
}

export function recurringPaymentSchedule<T extends RecordedRecurringPayment>(
  commitment: RecurringCommitment,
  payments: readonly T[],
) {
  const recorded = [...payments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const recordedPaid = recorded
    .filter((payment) => payment.currency === commitment.currency)
    .reduce((total, payment) => total.plus(payment.amount), decimal(0))
    .toFixed();

  const installment = commitment.kind === "external_installment";
  const completed = installment ? (commitment.installments_completed ?? 0) : 0;
  const total = installment ? (commitment.installment_count ?? 0) : 0;
  const remaining = installment ? Math.max(0, total - completed) : null;
  const earlierCompleted = installment
    ? Math.max(0, completed - recorded.length)
    : 0;
  const futureCount = installment ? (remaining ?? 0) : 4;
  const upcoming: string[] = [];
  let due = commitment.next_due_on;

  if (commitment.status === "active" || commitment.status === "paused") {
    for (let index = 0; index < futureCount; index += 1) {
      if (!installment && commitment.ends_on && due > commitment.ends_on) break;
      upcoming.push(due);
      due = nextRecurringDate(due, commitment.frequency);
    }
  }

  return {
    recorded,
    recordedPaid,
    completed,
    total,
    remaining,
    earlierCompleted,
    upcoming,
    remainingEstimate:
      remaining === null
        ? null
        : decimal(commitment.amount).times(remaining).toFixed(),
  };
}
