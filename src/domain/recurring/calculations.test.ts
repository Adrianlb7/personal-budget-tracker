import { installmentProgress, monthlyCommitmentTotal } from "./calculations";
import type { RecurringCommitment } from "./types";

const base: RecurringCommitment = {
  account_id: "a",
  amount: "12",
  created_at: "",
  currency: "USD",
  destination_account_id: null,
  ends_on: null,
  frequency: "monthly",
  id: "1",
  installment_count: null,
  installments_completed: null,
  kind: "subscription",
  name: "Cloud",
  next_due_on: "2026-09-10",
  payment_method: "external_expense",
  starts_on: "2026-01-01",
  status: "active",
  updated_at: "",
  user_id: "u",
};

describe("recurring calculations", () => {
  it("normalizes active commitments to a monthly estimate", () => {
    expect(
      monthlyCommitmentTotal([
        base,
        { ...base, id: "2", amount: "120", frequency: "yearly" },
        { ...base, id: "3", amount: "100", status: "paused" },
      ]),
    ).toBe("22");
  });
  it("tracks installment progress", () => {
    expect(
      installmentProgress({
        ...base,
        kind: "external_installment",
        installment_count: 12,
        installments_completed: 4,
      }),
    ).toEqual({ completed: 4, remaining: 8, total: 12 });
  });
});
