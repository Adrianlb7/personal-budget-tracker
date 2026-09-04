import type { Currency } from "@/domain/accounts/types";

export const transactionTypes = ["income", "expense"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export type TransactionDetail = {
  account_id: string;
  account_name: string;
  amount: string;
  category_id: string;
  category_name: string;
  created_at: string;
  currency: Currency;
  date: string;
  description: string;
  direction: "inflow" | "outflow";
  id: string;
  metadata: Record<string, unknown>;
  notes: string | null;
  type: TransactionType;
  user_id: string;
};
