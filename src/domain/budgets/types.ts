import type { Currency } from "@/domain/accounts/types";

export type MonthlyBudget = {
  amount: string;
  category_id: string;
  category_name: string;
  created_at: string;
  currency: Currency;
  id: string;
  month: string;
  updated_at: string;
  user_id: string;
};

export type BudgetProgress = MonthlyBudget & {
  percentUsed: string;
  remaining: string;
  spent: string;
};
