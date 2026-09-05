import { z } from "zod";
import { normalizeMoneyInput } from "@/domain/accounts/validation";
import { decimal } from "@/lib/money/decimal";

const amountPattern = /^\d+(?:[.,]\d{1,6})?$/;

export const budgetSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(amountPattern, "Enter a positive amount with up to 6 decimals.")
    .transform(normalizeMoneyInput)
    .refine(
      (value) => decimal(value).greaterThan(0),
      "Amount must be positive.",
    ),
  category: z.string().trim().min(1, "Enter a category.").max(80),
  currency: z.enum(["USD", "CLP"]),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Choose a valid month."),
});

export type BudgetFormState = {
  errors?: Partial<Record<keyof z.input<typeof budgetSchema>, string[]>>;
  message?: string;
  success?: boolean;
};
