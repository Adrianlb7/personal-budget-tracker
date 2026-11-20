import type { RecurringCommitment } from "./types";
import {
  nextRecurringDate,
  recurringPaymentSchedule,
} from "./payment-schedule";

const commitment: RecurringCommitment = {
  icon_emoji: null,
  icon_image_path: null,
  account_id: null,
  amount: "12.50",
  created_at: "2026-01-01T00:00:00Z",
  currency: "USD",
  destination_account_id: null,
  ends_on: null,
  frequency: "monthly",
  id: "commitment-1",
  installment_count: 4,
  installments_completed: 2,
  kind: "external_installment",
  name: "Laptop",
  next_due_on: "2026-03-31",
  payment_method: "external_expense",
  starts_on: "2026-01-31",
  status: "active",
  updated_at: "2026-01-01T00:00:00Z",
  user_id: "user-1",
};

describe("recurring payment schedule", () => {
  it("matches month-end and leap-day due date behavior", () => {
    expect(nextRecurringDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(nextRecurringDate("2026-02-28", "monthly")).toBe("2026-03-28");
    expect(nextRecurringDate("2024-02-29", "yearly")).toBe("2025-02-28");
    expect(nextRecurringDate("2026-12-28", "weekly")).toBe("2027-01-04");
  });

  it("uses recorded amounts for paid totals and current amount for remaining estimates", () => {
    const schedule = recurringPaymentSchedule(commitment, [
      { id: "2", date: "2026-02-28", amount: "11.95", currency: "USD" },
      { id: "1", date: "2026-01-31", amount: "12.50", currency: "USD" },
    ]);

    expect(schedule.recorded.map((payment) => payment.id)).toEqual(["1", "2"]);
    expect(schedule.recordedPaid).toBe("24.45");
    expect(schedule.remainingEstimate).toBe("25");
    expect(schedule.upcoming).toEqual(["2026-03-31", "2026-04-30"]);
    expect(schedule.earlierCompleted).toBe(0);
  });

  it("does not invent dates for installments completed before tracking", () => {
    const schedule = recurringPaymentSchedule(commitment, []);
    expect(schedule.earlierCompleted).toBe(2);
    expect(schedule.recordedPaid).toBe("0");
  });

  it("shows a short subscription forecast and respects the end date", () => {
    const schedule = recurringPaymentSchedule(
      {
        ...commitment,
        kind: "subscription",
        installment_count: null,
        installments_completed: null,
        ends_on: "2026-05-31",
      },
      [],
    );
    expect(schedule.upcoming).toEqual([
      "2026-03-31",
      "2026-04-30",
      "2026-05-30",
    ]);
    expect(schedule.remaining).toBeNull();
  });
});
