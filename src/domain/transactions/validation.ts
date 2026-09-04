import { z } from "zod";
import { decimal } from "@/lib/money/decimal";
import { normalizeMoneyInput } from "@/domain/accounts/validation";

const amountPattern = /^\d+(?:[.,]\d{1,6})?$/;

export function transactionDescriptionOrDefault(
  value: FormDataEntryValue | null,
  type: FormDataEntryValue | null,
) {
  if (typeof value === "string" && value.trim() !== "") return value;
  return type === "income" ? "September salary" : "Groceries";
}

export const transactionSchema = z.object({
  accountId: z.uuid("Choose an account."),
  amount: z
    .string()
    .trim()
    .regex(amountPattern, "Enter a positive amount with up to 6 decimals.")
    .transform(normalizeMoneyInput)
    .refine(
      (value) => decimal(value).greaterThan(0),
      "Amount must be greater than zero.",
    )
    .refine(
      (value) => decimal(value).lessThan("100000000000000"),
      "Amount is too large.",
    ),
  category: z
    .string()
    .trim()
    .min(1, "Enter a category.")
    .max(80, "Use 80 characters or fewer."),
  date: z.iso.date("Enter a valid date."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(160, "Use 160 characters or fewer."),
  notes: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
  type: z.enum(["income", "expense"]),
});

export type TransactionFormState = {
  errors?: Partial<
    Record<
      | "accountId"
      | "amount"
      | "category"
      | "date"
      | "description"
      | "notes"
      | "type",
      string[]
    >
  >;
  message?: string;
};
