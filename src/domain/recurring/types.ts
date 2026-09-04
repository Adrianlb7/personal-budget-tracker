import type { Currency } from "@/domain/accounts/types";

export type RecurringKind = "external_installment" | "subscription";
export type InstallmentPaymentMethod =
  "external_expense" | "savings_reimbursement";
export type RecurringFrequency = "monthly" | "weekly" | "yearly";
export type RecurringStatus = "active" | "cancelled" | "completed" | "paused";

export type RecurringCommitment = {
  account_id: string;
  amount: string;
  created_at: string;
  currency: Currency;
  destination_account_id: string | null;
  ends_on: string | null;
  frequency: RecurringFrequency;
  id: string;
  installment_count: number | null;
  installments_completed: number | null;
  kind: RecurringKind;
  name: string;
  next_due_on: string;
  payment_method: InstallmentPaymentMethod;
  starts_on: string;
  status: RecurringStatus;
  updated_at: string;
  user_id: string;
};
