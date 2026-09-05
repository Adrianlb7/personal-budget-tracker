export const accountTypes = [
  "cash",
  "checking",
  "savings",
  "investment",
  "credit_debt",
] as const;

export type AccountType = (typeof accountTypes)[number];

export const accountTypeLabels: Record<AccountType, string> = {
  cash: "Cash",
  checking: "Checking",
  savings: "Savings",
  investment: "Investment",
  credit_debt: "Credit or debt",
};

export const currencies = ["USD", "CLP", "BTC"] as const;
export type Currency = (typeof currencies)[number];

export type Account = {
  archived_at: string | null;
  created_at: string;
  current_balance?: string;
  currency: Currency;
  id: string;
  name: string;
  opening_balance: string;
  type: AccountType;
  updated_at: string;
  user_id: string;
};
