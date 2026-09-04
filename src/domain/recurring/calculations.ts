import { decimal } from "@/lib/money/decimal";
import type { RecurringCommitment } from "./types";

export function monthlyCommitmentTotal(items: readonly RecurringCommitment[]) {
  return items
    .filter((item) => item.status === "active")
    .reduce((total, item) => {
      if (item.frequency === "weekly")
        return total.plus(decimal(item.amount).times(52).dividedBy(12));
      if (item.frequency === "yearly")
        return total.plus(decimal(item.amount).dividedBy(12));
      return total.plus(item.amount);
    }, decimal(0))
    .toDecimalPlaces(2)
    .toFixed();
}

export function installmentProgress(item: RecurringCommitment) {
  if (item.kind !== "external_installment" || !item.installment_count)
    return null;
  const completed = item.installments_completed ?? 0;
  return {
    completed,
    remaining: item.installment_count - completed,
    total: item.installment_count,
  };
}
