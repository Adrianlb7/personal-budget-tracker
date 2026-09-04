import type { Currency } from "@/domain/accounts/types";

export const transactionTypes = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export type TransactionDetail = {
  account_id: string;
  account_name: string;
  amount: string;
  category_id: string | null;
  category_name: string | null;
  created_at: string;
  currency: Currency;
  date: string;
  description: string;
  direction: "inflow" | "outflow";
  destination_account_id: string | null;
  destination_account_name: string | null;
  destination_amount: string | null;
  destination_currency: Currency | null;
  id: string;
  metadata: Record<string, unknown>;
  notes: string | null;
  type: TransactionType;
  user_id: string;
};
